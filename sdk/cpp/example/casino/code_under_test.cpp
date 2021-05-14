/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "example/casino/code_under_test.hpp"
#include "fmt/ostream.h"
#include <numeric>
#include <random>
#include <sstream>

#define LOG_INFO(...) fmt::print(stdout, __VA_ARGS__);

#ifdef DEBUG
#define LOG_DEBUG(...) LOG_INFO(__VA_ARGS__)
#else
#define LOG_DEBUG(...)
#endif

namespace { namespace filescope {

    template <typename T>
    std::shared_ptr<touca::casino::Policy> makePolicy(
        const touca::casino::Hand& hand)
    {
        return std::make_shared<T>(hand);
    }

}} // namespace ::filescope

namespace touca { namespace casino {

    const std::vector<Card::Suite> Card::suites = { Suite::Clubs,
        Suite::Diamonds,
        Suite::Hearts,
        Suite::Spades };

    const std::vector<Card::Rank> Card::ranks = {
        Rank::Two, Rank::Three, Rank::Four, Rank::Five, Rank::Six,
        Rank::Seven, Rank::Eight, Rank::Nine, Rank::Ten, Rank::Jack,
        Rank::Queen, Rank::King, Rank::Ace
    };

    const std::map<Card::Suite, std::string> Card::suiteNames = {
        { Card::Suite::Clubs, "Clubs" },
        { Card::Suite::Diamonds, "Diamonds" },
        { Card::Suite::Hearts, "Hearts" },
        { Card::Suite::Spades, "Spades" }
    };

    const std::map<Card::Rank, std::string> Card::rankNames = {
        { Rank::Two, "Two" }, { Rank::Three, "Three" }, { Rank::Four, "Four" }, { Rank::Five, "Five" }, { Rank::Six, "Six" }, { Rank::Seven, "Seven" }, { Rank::Eight, "Eight" }, { Rank::Nine, "Nine" }, { Rank::Ten, "Ten" }, { Rank::Jack, "Jack" }, { Rank::Queen, "Queen" }, { Rank::King, "King" }, { Rank::Ace, "Ace" }
    };

    const std::string Card::suiteCodes = "CDHS";
    const std::string Card::rankCodes = "234567890JQK1";

    Card::Card(const Suite suite, const Rank rank)
        : _rank(rank)
        , _suite(suite)
    {
    }

    Card::Rank Card::rank() const
    {
        return _rank;
    }

    Card::Suite Card::suite() const
    {
        return _suite;
    }

    std::string Card::describe() const
    {
        return rankNames.at(_rank) + " of " + suiteNames.at(_suite);
    }

    bool Card::operator<(const Card& other) const
    {
        return _rank < other._rank
            || (_rank == other._rank && _suite < other._suite);
    }

    bool Card::operator==(const Card& other) const
    {
        return !(*this < other) && !(other < *this);
    }

    Card Hand::draw(const Card& card)
    {
        auto it = std::find(_cards.begin(), _cards.end(), card);
        if (_cards.end() == it) {
            throw std::invalid_argument("card missing from player hand");
        }
        auto out = *it;
        _cards.erase(it);
        return out;
    }

    Policy::Policy(const std::string& name, const Hand& hand)
        : _name(name)
        , _hand(hand)
    {
        std::sort(_hand._cards.begin(), _hand._cards.end());
    }

    std::shared_ptr<Policy> Policy::makePolicy(
        const Policy::Type type,
        const Hand& hand)
    {
        using func_t = std::function<std::shared_ptr<Policy>(const Hand&)>;
        std::map<Policy::Type, func_t> policies = {
            { Policy::Type::Default, &filescope::makePolicy<DefaultPolicy> },
            { Policy::Type::Simple, &filescope::makePolicy<SimplePolicy> }
        };
        return policies.at(type)(hand);
    }

    DefaultPolicy::DefaultPolicy(const Hand& hand)
        : Policy("default", hand)
    {
    }

    Card DefaultPolicy::bid(const std::vector<Card>& bids)
    {
        // if we are the first in round to bid,
        // bid our highest card to win the round
        if (bids.empty()) {
            return _hand.draw(_hand._cards.back());
        }
        // else, find highest bid and check if we have a higher card than that
        std::vector<Card> bidsCopy(bids.begin(), bids.end());
        std::sort(bidsCopy.begin(), bidsCopy.end());
        auto highBid = bidsCopy.back();
        LOG_DEBUG("highest bid so far: {}", highBid);
        auto it = _hand._cards.begin();
        while (it != _hand._cards.end() && *it < highBid) {
            ++it;
        }
        // if we may not win this round, bid our lowest card
        // if we may, bid lowest card that is higher than highest bid
        return it == _hand._cards.end() ? _hand.draw(_hand._cards.front())
                                        : _hand.draw(*it);
    }

    SimplePolicy::SimplePolicy(const Hand& hand)
        : Policy("simple", hand)
    {
    }

    Card SimplePolicy::bid(const std::vector<Card>& bids)
    {
        // always bid our highest card regardless of the cards on the table
        std::ignore = bids;
        return _hand.draw(_hand._cards.back());
    }

    Player::Player(const std::string& name, const Hand& hand)
        : _hand(hand)
        , _name(name)
    {
        setPolicy(Policy::Type::Default);
    }

    void Player::setPolicy(const Policy::Type type)
    {
        _policy = Policy::makePolicy(type, _hand);
    }

    Card Player::bid(const std::vector<Card>& bids)
    {
        LOG_DEBUG("{} hand {}", _name, _hand);
        const auto card = _policy->bid(bids);
        _hand.draw(card);
        LOG_DEBUG("{} drew {}", _name, card);
        return card;
    }

    void Player::collect(const std::vector<Card>& trick)
    {
        std::copy(trick.begin(), trick.end(), std::back_inserter(_tricks));
    }

    Table::Table()
    {
    }

    void Table::generate()
    {
        NameGenerator gen;
        std::random_device rd;
        std::mt19937 urbg(rd());
        std::uniform_int_distribution<> dis(0, 3);

        std::set<std::string> names;
        while (names.size() < 4) {
            names.emplace(gen.name());
        }

        std::array<unsigned int, 52> nums;
        std::iota(nums.begin(), nums.end(), 0);
        std::shuffle(nums.begin(), nums.end(), urbg);

        std::array<std::vector<Card>, 4> hands;
        for (size_t i = 0u; i < nums.size(); ++i) {
            auto suite = Card::suites.at(nums.at(i) / 13);
            auto rank = Card::ranks.at(nums.at(i) % 13);
            hands.at(i / 13).emplace_back(suite, rank);
        }

        _pot.clear();
        _players.clear();
        _name.assign(gen.adj() + '-' + *std::next(names.begin(), dis(urbg)));
        for (size_t i = 0u; i < hands.size(); ++i) {
            Hand hand { hands.at(i) };
            _players.emplace_back(*std::next(names.begin(), i), hand);
        }
    }

    void Table::setPolicy(const Policy::Type type)
    {
        std::for_each(_players.begin(), _players.end(), [type](Player& p) {
            p.setPolicy(type);
        });
    }

    RoundResult Table::playRound()
    {
        RoundResult result;
        LOG_INFO("{}", *this);
        for (auto i = 0u; i < _players.size(); ++i) {
            const auto idx = (_button + i) % 4;
            const auto& card = _players.at(idx).bid(_pot);
            _pot.emplace_back(card);
            result._bids.emplace(_players.at(idx)._name, card);
        }
        const auto& winningBid = std::max_element(_pot.begin(), _pot.end());
        const auto idx = static_cast<unsigned int>(std::distance(_pot.begin(), winningBid));
        _button = (_button + idx) % 4;
        result._winner = _players.at(_button)._name;

        LOG_DEBUG("cards on the table: {}", Hand { _pot });
        LOG_DEBUG("winning card: {}", *winningBid);
        LOG_DEBUG("{} won the round", _players.at(_button)._name);

        _players.at(_button).collect(_pot);
        _pot.clear();
        LOG_INFO("{}", result);
        return result;
    }

    const std::string Table::name() const
    {
        return _name;
    }

    const std::vector<Player> Table::players() const
    {
        return _players;
    }

    bool Table::operator<(const Table& table) const
    {
        return _name < table._name;
    }

    std::ostream& operator<<(std::ostream& os, const Card& card)
    {
        return os << Card::suiteCodes.at(static_cast<unsigned int>(card._suite))
                  << Card::rankCodes.at(static_cast<unsigned int>(card._rank));
    }

    std::ostream& operator<<(std::ostream& os, const Hand& hand)
    {
        for (const auto& card : hand._cards) {
            os << card;
        }
        return os;
    }

    std::ostream& operator<<(std::ostream& os, const Player& player)
    {
        os << player._name << ',' << player._hand;
        if (!player._tricks.empty()) {
            os << ',';
        }
        for (const auto& card : player._tricks) {
            os << card;
        }
        return os;
    }

    std::ostream& operator<<(std::ostream& os, const RoundResult& result)
    {
        for (const auto& kvp : result._bids) {
            os << (kvp.first.compare(result._winner) ? ' ' : '*');
            os << kvp.first << ": " << kvp.second.describe() << "\n";
        }
        return os;
    }

    std::ostream& operator<<(std::ostream& os, const Table& table)
    {
        os << table._name << '\n';
        for (const auto& player : table._players) {
            os << player << '\n';
        }
        return os;
    }

    std::istream& operator>>(std::istream& is, Table& table)
    {
        const auto& parseCards = [](const std::string& message) {
            std::vector<Card> cards;
            for (auto i = 0u; i < message.length(); i = i + 2) {
                auto code = message.substr(i, 2);
                auto j = Card::suiteCodes.find(code.front());
                auto k = Card::rankCodes.find(code.back());
                cards.emplace_back(Card::suites.at(j), Card::ranks.at(k));
            }
            return cards;
        };
        std::string line;
        is >> table._name;
        for (auto i = 0u; i < 4; ++i) {
            is >> line;
            std::vector<std::string> tokens(3u);
            const auto index = line.find(',');
            table._players.emplace_back(line.substr(0, index), Hand { parseCards(line.substr(index + 1)) });
        }
        return is;
    }

    const std::vector<std::string> NameGenerator::names = {
        "adele", "ale", "alessandro", "alessio", "alice",
        "angela", "angelo", "anna", "antonella", "arianna",
        "barbara", "benedetta", "camilla", "carlotta", "caterina",
        "chiara", "claudia", "cristian", "cristina", "damiano",
        "daniela", "dario", "debora", "diana", "domenico",
        "elena", "elia", "elisa", "emanuela", "emiliano",
        "enrico", "erica", "eva", "fabrizio", "federico",
        "flavio", "francesco", "gabriele", "gaia", "giada",
        "gianmarco", "gioia", "giorgio", "giovanni", "giulio",
        "giusy", "greta", "ilaria", "irene", "ivan",
        "jessica", "julia", "laura", "leonardo", "linda",
        "lorenzo", "lucia", "lucrezia", "luigi", "manuel",
        "marco", "maria", "marina", "mark", "martin",
        "mary", "massimo", "matteo", "maurizio", "max",
        "michael", "michele", "miriam", "monica", "nicholas",
        "nicole", "noemi", "paolo", "pier", "pietro",
        "raffaele", "riccardo", "roberto", "rosario", "salvatore",
        "samuel", "sara", "saverio", "sergio", "simon",
        "simone", "sonia", "stefano", "thomas", "tom",
        "umberto", "valeria", "vanessa", "vincenzo", "vito"
    };

    const std::vector<std::string> NameGenerator::adjectives = {
        "admiring", "adoring", "affectionate", "agitated",
        "silly", "amazing", "angry", "awesome",
        "blissful", "sleepy", "bold", "boring",
        "brave", "charming", "stoic", "clever",
        "cocky", "cool", "compassionate", "stupefied",
        "competent", "condescending", "confident", "cranky",
        "suspicious", "crazy", "dazzling", "determined",
        "distracted", "sweet", "dreamy", "eager",
        "ecstatic", "elastic", "tender", "elated",
        "elegant", "eloquent", "epic", "thirsty",
        "fervent", "festive", "flamboyant", "focused",
        "trusting", "friendly", "frosty", "gallant",
        "gifted", "unruffled", "goofy", "gracious",
        "happy", "hardcore", "upbeat", "heuristic",
        "hopeful", "hungry", "infallible", "vibrant",
        "inspiring", "jolly", "jovial", "keen",
        "vigilant", "kind", "laughing", "loving",
        "lucid", "vigorous", "magical", "mystifying",
        "modest", "musing", "wizardly", "naughty",
        "nervous", "nifty", "nostalgic", "wonderful",
        "objective", "optimistic", "peaceful", "pedantic",
        "xenodochial", "pensive", "practical", "priceless",
        "quirky", "youthful", "quizzical", "recursing",
        "relaxed", "reverent", "zealous", "romantic",
        "sad", "serene", "sharp", "zen"
    };

    std::string NameGenerator::random(
        const std::vector<std::string> items) const
    {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(
            0, static_cast<int>(items.size() - 1));
        return items.at(dis(gen));
    }

    std::string NameGenerator::name() const
    {
        return random(NameGenerator::names);
    }

    std::string NameGenerator::adj() const
    {
        return random(NameGenerator::adjectives);
    }

}} // namespace touca::casino
