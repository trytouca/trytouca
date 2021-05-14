/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/touca.hpp"
#include <array>
#include <iostream>
#include <unordered_map>
#include <vector>

namespace touca { namespace casino {

    class Card {
    public:
        enum class Suite : unsigned char {
            Clubs,
            Diamonds,
            Hearts,
            Spades
        };
        enum class Rank : unsigned char {
            Two,
            Three,
            Four,
            Five,
            Six,
            Seven,
            Eight,
            Nine,
            Ten,
            Jack,
            Queen,
            King,
            Ace
        };
        Card(const Suite suite, const Rank rank);
        Rank rank() const;
        Suite suite() const;
        std::string describe() const;
        bool operator<(const Card& other) const;
        bool operator==(const Card& other) const;
        friend std::ostream& operator<<(std::ostream& os, const Card& card);
        static const std::vector<Suite> suites;
        static const std::vector<Rank> ranks;
        static const std::string suiteCodes;
        static const std::string rankCodes;
        static const std::map<Card::Suite, std::string> suiteNames;
        static const std::map<Card::Rank, std::string> rankNames;

    private:
        Card::Rank _rank;
        Card::Suite _suite;
    };

    struct Hand {
        std::vector<Card> _cards;
        Card draw(const Card& card);
        friend std::ostream& operator<<(std::ostream& os, const Hand& hand);
    };

    class Policy {
    protected:
        std::string _name;
        Hand _hand;

    public:
        enum class Type {
            Default,
            Simple
        };
        Policy(const std::string& name, const Hand& hand);
        virtual ~Policy() = default;
        virtual Card bid(const std::vector<Card>& bids) = 0;
        static std::shared_ptr<Policy> makePolicy(
            const Policy::Type type,
            const Hand& hand);
    };

    class DefaultPolicy : public Policy {
    public:
        explicit DefaultPolicy(const Hand& hand);
        Card bid(const std::vector<Card>& bids) override;
    };

    class SimplePolicy : public Policy {
    public:
        explicit SimplePolicy(const Hand& hand);
        Card bid(const std::vector<Card>& bids) override;
    };

    class Player {
        Hand _hand;
        std::vector<Card> _tricks;
        std::shared_ptr<Policy> _policy;
        friend convert::Conversion<Player>;

    public:
        const std::string _name;
        Player(const std::string& name, const Hand& hand);
        Card bid(const std::vector<Card>& bids);
        void setPolicy(const Policy::Type type);
        void collect(const std::vector<Card>& trick);
        friend std::ostream& operator<<(std::ostream& os, const Player& player);
    };

    struct RoundResult {
        std::unordered_map<std::string, Card> _bids;
        std::string _winner;
        friend std::ostream& operator<<(
            std::ostream& os,
            const RoundResult& res);
    };

    class Table {
        std::string _name;
        std::vector<Card> _pot;
        unsigned int _button = 0u;
        std::vector<Player> _players;
        friend convert::Conversion<Table>;

    public:
        Table();
        void generate();
        RoundResult playRound();
        void setPolicy(const Policy::Type type);
        const std::string name() const;
        const std::vector<Player> players() const;
        bool operator<(const Table& table) const;
        friend std::istream& operator>>(std::istream& is, Table& table);
        friend std::ostream& operator<<(std::ostream& os, const Table& table);
    };

    class NameGenerator {
        static const std::vector<std::string> names;
        static const std::vector<std::string> adjectives;
        std::string random(const std::vector<std::string> list) const;

    public:
        std::string adj() const;
        std::string name() const;
    };

}} // namespace touca::casino

// clang-format off
TOUCA_CONVERSION_LOGIC(touca::casino::Card)
{
    TOUCA_CONVERSION_FUNCTION(touca::casino::Card, value)
    {
        auto out = TOUCA_CUSTOM_TYPE("Card");
        //out->add("suite", static_cast<unsigned int>(value.suite()));
        //out->add("rank", static_cast<unsigned int>(value.rank()));
        out->add("value", value.describe());
        return out;
    }
};

TOUCA_CONVERSION_LOGIC(touca::casino::RoundResult)
{
    TOUCA_CONVERSION_FUNCTION(touca::casino::RoundResult, value)
    {
        auto out = TOUCA_CUSTOM_TYPE("RoundResult");
        out->add("drawn_cards", value._bids);
        out->add("winner", value._winner);
        return out;
    }
};

TOUCA_CONVERSION_LOGIC(touca::casino::Player)
{
    TOUCA_CONVERSION_FUNCTION(touca::casino::Player, value)
    {
        auto out = TOUCA_CUSTOM_TYPE("Player");
        out->add("name", value._name);
        out->add("hand", value._hand._cards);
        out->add("score", value._tricks.size() / 4u);
        return out;
    }
};

TOUCA_CONVERSION_LOGIC(touca::casino::Table)
{
    TOUCA_CONVERSION_FUNCTION(touca::casino::Table, value)
    {
        auto out = TOUCA_CUSTOM_TYPE("Table");
        out->add("name", value._name);
        out->add("button", value._button);
        out->add("players", value._players);
        out->add("on_table", value._pot);
        return out;
    }
};
// clang-format on
