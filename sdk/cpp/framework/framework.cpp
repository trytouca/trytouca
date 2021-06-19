// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/framework.hpp"
#include "cxxopts.hpp"
#include "fmt/printf.h"
#include "rapidjson/document.h"
#include "touca/devkit/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/extra/version.hpp"
#include "touca/framework/detail/utils.hpp"
#include "touca/framework/suites.hpp"
#include "touca/touca.hpp"
#include <fstream>
#include <iostream>
#include <thread>

#ifdef _WIN32
#undef GetObject
#endif

namespace touca { namespace framework {

    /**
     *
     */
    bool Workflow::parse_options(int argc, char* argv[])
    {
        std::ignore = argc;
        std::ignore = argv;
        return true;
    }

    /**
     *
     */
    bool Workflow::skip(const Testcase& testcase) const
    {
        touca::filesystem::path outputDirCase = _options.at("output-dir");
        outputDirCase /= _options.at("suite");
        outputDirCase /= _options.at("revision");
        outputDirCase /= testcase;
        if (_options.count("save-as-binary") && _options.at("save-as-binary") == "true") {
            outputDirCase /= "touca.bin";
        } else if (_options.count("save-as-json") && _options.at("save-as-json") == "true") {
            outputDirCase /= "touca.json";
        } else {
            return false;
        }
        return touca::filesystem::exists(outputDirCase.string());
    }

    /**
     *
     */
    void Workflow::add_options(const Options& options)
    {
        _options.insert(options.begin(), options.end());
    }

    /**
     *
     */
    void Suite::push(const Testcase& testcase)
    {
        if (!_set.count(testcase)) {
            _set.insert(testcase);
            _vec.push_back(testcase);
        }
    }

    /**
     *
     */
    cxxopts::Options cli_options()
    {

        cxxopts::Options options("touca-framework", "Command Line Options");

        // clang-format off
        options.add_options("main")
            ("h,help", "displays this help message")
            ("v,version", "prints version of this executable")
            ("r,revision",
                "version to associate with testresults",
                cxxopts::value<std::string>())
            ("c,config-file",
                "path to configuration file",
                cxxopts::value<std::string>())
            ("o,output-dir",
                "path to output directory",
                cxxopts::value<std::string>()->default_value("./results"))
            ("api-key",
                "Touca server api key",
                cxxopts::value<std::string>())
            ("api-url",
                "Touca server api url",
                cxxopts::value<std::string>())
            ("suite",
                "slug of suite to which testresults belong",
                cxxopts::value<std::string>())
            ("team",
                "slug of team to which testresults belong",
                cxxopts::value<std::string>())
            ("testcase",
                "single testcase to feed to the workflow",
                cxxopts::value<std::string>())
            ("testcase-file",
                "single file listing testcases to feed to the workflow",
                cxxopts::value<std::string>())
            ("skip-logs",
                "do not generate log files",
                cxxopts::value<std::string>()->implicit_value("true"))
            ("skip-post",
                "do not submit results to Touca server",
                cxxopts::value<std::string>()->implicit_value("true"))
            ("save-as-json",
                "save a copy of test results on local disk in json format",
                cxxopts::value<std::string>()->implicit_value("true"))
            ("save-as-binary",
                "save a copy of test results on local disk in binary format",
                cxxopts::value<std::string>()->default_value("true"))
            ("stream-redirection",
                "redirect content printed to standard streams to files",
                cxxopts::value<std::string>()->default_value("true"))
            ("log-level",
                "level of detail with which events are logged",
                cxxopts::value<std::string>()->default_value("info"))
            ("overwrite",
                "overwrite result directory for testcase if it already exists",
                cxxopts::value<std::string>()->implicit_value("true"));
        // clang-format on

        return options;
    }

    /**
     * @param argc number of arguments provided to the application
     * @param argv list of arguments provided to the application
     * @param options application configuration parameters
     */
    bool parse_cli_options(int argc, char* argv[], Options& options)
    {
        auto opts = cli_options();
        opts.allow_unrecognised_options();
        try {
            const auto& result = opts.parse(argc, argv);
            for (const auto& key : { "log-level", "output-dir", "save-as-binary", "stream-redirection" }) {
                options[key] = result[key].as<std::string>();
            }
            for (const auto& opt : opts.group_help("main").options) {
                if (!result.count(opt.l)) {
                    continue;
                }
                if (opt.l == "help" || opt.l == "version") {
                    options[opt.l] = "true";
                    continue;
                }
                options[opt.l] = result[opt.l].as<std::string>();
            }
        } catch (const cxxopts::OptionParseException& ex) {
            touca::print_error("failed to parse command line arguments: {}\n", ex.what());
            return false;
        }

        return true;
    }

    /**
     *
     */
    bool parse_file_options(Options& options)
    {
        // if user is asking for help description or framework version,
        // do not parse the configuration file even if it is specified.

        if (options.count("help") || options.count("version")) {
            return true;
        }

        // if configuration file is not specified yet a file config.json
        // exists in current directory, attempt to use that file.

        if (!options.count("config-file")) {
            if (!touca::filesystem::is_regular_file("./config.json")) {
                return true;
            }
            options.emplace("config-file", "./config.json");
        }

        const auto& configFile = options.at("config-file");

        // configuration file must exist if it is specified

        if (!touca::filesystem::is_regular_file(configFile)) {
            touca::print_error("configuration file not found: {}\n", configFile);
            return false;
        }

        // load configuration file in memory

        const auto& content = touca::load_string_file(configFile);

        // parse configuration file

        rapidjson::Document document;
        if (document.Parse<0>(content.c_str()).HasParseError()) {
            touca::print_error("failed to parse configuration file\n");
            return false;
        }

        // we expect content to be a json object

        if (!document.IsObject()) {
            touca::print_error("expected configuration file to be a json object\n");
            return false;
        }

        for (const auto& topLevelKey : { "framework", "touca", "workflow" }) {
            if (!document.HasMember(topLevelKey)) {
                continue;
            }
            if (!document[topLevelKey].IsObject()) {
                touca::print_error("field {} in configuration file has unexpected type\n", topLevelKey);
                return false;
            }
            for (const auto& rjMember : document[topLevelKey].GetObject()) {
                const auto& key = rjMember.name.GetString();
                if (rjMember.value.IsBool()) {
                    options[key] = rjMember.value.GetBool() ? "true" : "false";
                    continue;
                }
                if (!rjMember.value.IsString()) {
                    touca::print_warning("Ignoring option \"{}\":\"{}\" in configuration file.\n");
                    touca::print_warning("Expected value to be of type string.\n", topLevelKey, key);
                    continue;
                }
                options[key] = rjMember.value.GetString();
            }
        }

        return true;
    }

    /**
     *
     */
    bool parse_api_url(Options& options)
    {
        // it is okay if configuration option `--api-url` is not specified
        if (!options.count("api-url")) {
            return true;
        }
        touca::ApiUrl api(options.at("api-url"));
        if (!options.count("team") && !api._team.empty()) {
            options["team"] = api._team;
        }
        if (!options.count("suite") && !api._suite.empty()) {
            options["suite"] = api._suite;
        }
        if (!options.count("revision") && !api._revision.empty()) {
            options["revision"] = api._revision;
        }
        return true;
    }

    /**
     *
     */
    bool parse_options(int argc, char* argv[], Options& options)
    {
        auto ret = true;
        ret &= parse_cli_options(argc, argv, options);
        ret &= parse_file_options(options);
        ret &= parse_api_url(options);
        return ret;
    }

    /**
     *
     */
    bool expect_options(const Options& options, const std::vector<std::string>& keys)
    {
        const auto isMissing = [&options](const std::string& key) {
            return !options.count(key);
        };
        const auto hasMissing = std::any_of(keys.begin(), keys.end(), isMissing);
        if (!hasMissing) {
            return true;
        }
        fmt::print(std::cerr, "expected configuration options:\n");
        for (const auto& key : keys) {
            if (!options.count(key)) {
                fmt::print(std::cerr, " - {}\n", key);
            }
        }
        return false;
    }

    /**
     *
     */
    bool validate_api_url(const Options& options)
    {
        touca::ApiUrl api(options.at("api-url"));
        if (!api.confirm(options.at("team"), options.at("suite"), options.at("revision"))) {
            fmt::print(std::cerr, "{}\n", api._error);
            return false;
        }
        return true;
    }

    /**
     *
     */
    bool validate_options(const Options& options)
    {
        // we always expect a value for options `--revision` and `output-dir`.

        if (!expect_options(options, { "output-dir", "revision", "suite", "team" })) {
            return false;
        }

        // unless command line option `--skip-post` is specified,
        // we expect a value for option `--api-url`.

        if (!options.count("skip-post") && !expect_options(options, { "api-url" })) {
            return false;
        }

        // values of options `--api-url`, `--suite`, `--revision` and `team`
        // must be consistent.

        if (options.count("api-url") && !validate_api_url(options)) {
            return false;
        }

        // unless option `--skip-logs` is specified, check that
        // value of `--log-level` is one of `debug`, `info` or `warning`.

        if (!options.count("skip-logs")) {
            const auto& level = options.at("log-level");
            const auto& levels = { "debug", "info", "warning" };
            const auto isValid = std::find(levels.begin(), levels.end(), level) != levels.end();
            if (!isValid) {
                touca::print_error("value of option \"--log-level\" must be one of \"debug\", \"info\" or \"warning\".\n");
                return false;
            }
        }

        return true;
    }

    /**
     *
     */
    class LogFrontend {
    public:
        template <typename... Args>
        inline void log(const LogLevel level, const std::string& fmtstr, Args&&... args) const
        {
            publish(level, fmt::format(fmtstr, std::forward<Args>(args)...));
        }

        void add_subscriber(const std::shared_ptr<LogSubscriber> logger, const LogLevel level = LogLevel::Info)
        {
            _subscribers.emplace_back(logger, level);
        }

    private:
        void publish(const LogLevel level, const std::string& msg) const
        {
            for (const auto& kvp : _subscribers) {
                if (level < kvp.second) {
                    continue;
                }
                kvp.first->log(level, msg);
            }
        }

        std::vector<std::pair<const std::shared_ptr<LogSubscriber>, LogLevel>> _subscribers;
    };

    /**
     *
     */
    std::string stringify(const LogLevel& log_level)
    {
        static const std::map<LogLevel, std::string> names = {
            { LogLevel::Debug, "debug" },
            { LogLevel::Info, "info" },
            { LogLevel::Warning, "warning" },
            { LogLevel::Error, "error" },
        };
        return names.at(log_level);
    }

    /**
     *
     */
    class ConsoleLogger : public LogSubscriber {
    public:
        void log(const LogLevel level, const std::string& msg) override
        {
            fmt::print(std::cout, "{0:<8}{1:}\n", stringify(level), msg);
        }
    };

    /**
     *
     */
    class FileLogger : public LogSubscriber {
    public:
        FileLogger(const touca::filesystem::path& logDir)
            : LogSubscriber()
        {
            const auto logFilePath = logDir / "touca.log";
            _ofs = std::ofstream(logFilePath.string(), std::ios::trunc);
        }

        ~FileLogger()
        {
            _ofs.close();
        }

        void log(const LogLevel level, const std::string& msg) override
        {
            char timestamp[32];
            std::time_t point_t = std::time(nullptr);
            std::strftime(timestamp, sizeof(timestamp), "%FT%TZ", std::gmtime(&point_t));

            std::stringstream threadstamp;
            threadstamp << std::this_thread::get_id();

            _ofs << fmt::format("{} {} {:<8} {}\n", timestamp, threadstamp.str(), stringify(level), msg);
        }

    private:
        std::ofstream _ofs;
    };

    /**
     *
     */
    LogLevel find_log_level(const std::string& name)
    {
        static const std::unordered_map<std::string, LogLevel> values = {
            { "debug", LogLevel::Debug },
            { "info", LogLevel::Info },
            { "warning", LogLevel::Warning },
            { "error", LogLevel::Error }
        };
        return values.at(name);
    }

    /**
     *
     */
    struct SingleCaseSuite final : public Suite {
        SingleCaseSuite(const Testcase& testcase)
        {
            push(testcase);
        }
    };

    /**
     *
     */
    enum ExecutionOutcome : unsigned char {
        Pass,
        Fail,
        Skip
    };

    /**
     *
     */
    class Statistics {
        std::map<ExecutionOutcome, unsigned long> _v;

    public:
        void inc(ExecutionOutcome value)
        {
            if (!_v.count(value)) {
                _v[value] = 0u;
            }
            _v[value] += 1u;
        }
        unsigned long count(ExecutionOutcome value) const
        {
            return _v.count(value) ? _v.at(value) : 0u;
        }
    };

    /**
     *
     */
    class Timer {
        std::unordered_map<std::string, std::chrono::system_clock::time_point> _tics;
        std::unordered_map<std::string, std::chrono::system_clock::time_point> _tocs;

    public:
        void tic(const std::string& key)
        {
            _tics[key] = std::chrono::system_clock::now();
        }
        void toc(const std::string& key)
        {
            _tocs[key] = std::chrono::system_clock::now();
        }
        long long count(const std::string& key)
        {
            const auto& dur = _tocs.at(key) - _tics.at(key);
            return std::chrono::duration_cast<std::chrono::milliseconds>(dur)
                .count();
        }
    };

    /**
     *
     */
    class Printer {
        std::ofstream _fout;

    public:
        Printer(const touca::filesystem::path& path)
            : _fout(path.string(), std::ios::trunc)
        {
        }
        template <typename... Args>
        void print(const std::string& fmtstr, Args&&... args)
        {
            const auto content = fmt::format(fmtstr, std::forward<Args>(args)...);
            fmt::fprintf(_fout, content);
            fmt::fprintf(std::cout, content);
            _fout.flush();
            std::cout.flush();
        }
    };

    /**
     * @brief Notifies the server that all the test cases are executed and
     *        no further test results will be submitted for this version.
     *
     * @todo Currently, sealing the test results is an opt-in feature.
     *       Test framework should be explicltly configured to seal the
     *       version after execution of all the test cases. In v1.3, we
     *       would like to make this the default behavior.
     */
    bool seal_version(const Options& options, const LogFrontend& logger)
    {
        // skip if framework is configured to run offline.

        if (options.count("skip-post") && options.at("skip-post") == "true") {
            logger.log(LogLevel::Debug, "skipped sealing: test framework is configured to run offline");
            return true;
        }

        // skip if framework is configured not to seal version.
        // see todo item above.

        if (!options.count("seal") || options.at("seal") != "true") {
            logger.log(LogLevel::Debug, "skipped sealing: test framework is not configured to perform this operation");
            return true;
        }

        // submit request to seal this version and await server response

        logger.log(LogLevel::Debug, "attempting to seal this version");
        if (!touca::seal()) {
            logger.log(LogLevel::Error, "failed to seal this version");
            return false;
        }

        logger.log(LogLevel::Info, "sealed this version");
        return true;
    }

    /**
     *
     */
    int main_impl(int argc, char* argv[], Workflow& workflow)
    {
        using lg = LogLevel;
        Options options;

        // parse configuration options provided as command line arguments
        // or specified in the configuration file.

        if (!parse_options(argc, argv, options)) {
            fmt::print(std::cerr, "{}\n", cli_options().help());
            return EXIT_FAILURE;
        }

        // if user asks for help, print help message and exit

        if (options.count("help")) {
            fmt::print(std::cout, "{}\n", cli_options().help());
            const auto& desc = workflow.describe_options();
            if (!desc.empty()) {
                fmt::print(std::cout, "Workflow Options:\n{}\n", desc);
            }
            return EXIT_SUCCESS;
        }

        // if user asks for version, print version of this executable and exit

        if (options.count("version")) {
            fmt::print(std::cout, "{}.{}.{}\n", TOUCA_VERSION_MAJOR, TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
            return EXIT_SUCCESS;
        }

        // validate all configuration options

        if (!validate_options(options)) {
            touca::print_error("failed to validate configuration options.\n");
            return EXIT_FAILURE;
        }

        // now that configuration options are validated, this is our earliest
        // chance to setup our logging system and register basic loggers.

        LogFrontend logger;

        // always print warning and errors log events to console

        logger.add_subscriber(std::make_shared<ConsoleLogger>(), LogLevel::Warning);

        // establish output directory for this revision

        touca::filesystem::path outputDirRevision = options.at("output-dir");
        outputDirRevision /= options.at("suite");
        outputDirRevision /= options.at("revision");

        touca::filesystem::create_directories(outputDirRevision);

        // unless explicitly instructed not to do so, register a separate
        // file logger to write our events to a file in the output directory.

        if (!options.count("skip-logs")) {
            const auto& fileLogger = std::make_shared<FileLogger>(outputDirRevision);
            const auto& level = find_log_level(options.at("log-level"));
            logger.add_subscriber(fileLogger, level);
            logger.log(lg::Debug, "registered cpp framework file logger");
        }

        // propagate parsed options to the workflow class

        workflow.add_options(options);

        // parse extra workflow-specific options, if any

        if (!workflow.parse_options(argc, argv)) {
            logger.log(lg::Error, "failed to parse workflow-specific options");
            fmt::print(std::cout, "Workflow Options:\n{}\n", workflow.describe_options());
            return EXIT_FAILURE;
        }

        // log all parsed configuration options to help users debug their
        // workflow if validation fails. It is risky and less meaningful to
        // perform this operation any sooner.

        for (const auto& opt : options) {
            logger.log(lg::Debug, "{0:<16}: {1}", opt.first, opt.second);
        }

        // parse and validate extra workflow-specific options, using custom
        // logic provided by workflow author.

        if (!workflow.validate_options()) {
            logger.log(lg::Error, "failed to validate workflow-specific options");
            return EXIT_FAILURE;
        }

        // if workflow provides a separate logger, register it to consume
        // our events.

        const auto& workflowLogger = workflow.log_subscriber();
        if (workflowLogger) {
            const auto& level = find_log_level(options.at("log-level"));
            logger.add_subscriber(workflowLogger, level);
            logger.log(lg::Debug, "registered workflow logger");
        }

        // allow workflow authors to initialize their resources, if any,
        // such as external loggers or run tasks that need to be done
        // prior to execution of testcases.

        if (!workflow.initialize()) {
            logger.log(lg::Error, "failed to initialize workflow");
            return EXIT_FAILURE;
        }
        logger.log(lg::Debug, "initialized workflow");

        // Create a stream that simultaneously writes certain output
        // information printed on console to a file `Console.log` in
        // output directory for this revision.

        Printer printer(outputDirRevision / "Console.log");

        // Provide feedback to user that regression test is starting.
        // We perform this operation prior to configuring Touca client,
        // which may take a noticeable time.

        printer.print(
            "\nTouca Regression Test Framework\nSuite: {}\nRevision: {}\n\n",
            options.at("suite"), options.at("revision"));

        // initialize the client

        Options opts;
        const auto copyOption = [&options, &opts](
                                    const std::string& src, const std::string& dst) {
            if (options.count(src)) {
                opts.emplace(dst, options.at(src));
            }
        };
        copyOption("team", "team");
        copyOption("suite", "suite");
        copyOption("revision", "version");

        // if we are asked not to submit results, we configure the client
        // without passing api-related options so that we can still store
        // testcases in memory and later save them in file.

        if (!options.count("skip-post")) {
            copyOption("api-key", "api-key");
            copyOption("api-url", "api-url");
        } else {
            opts.emplace("handshake", "false");
        }

        // configure the client library

        touca::configure(opts);

        // check that the client is properly configured

        if (!touca::is_configured()) {
            logger.log(lg::Error, "failed to configure touca client: {}",
                touca::configuration_error());
            return EXIT_FAILURE;
        }
        logger.log(lg::Info, "configured touca client");

        // initialize suite if workflow is providing one.

        auto suite = workflow.suite();
        if (suite) {
            try {
                suite->initialize();
                logger.log(lg::Debug, "initialized suite");
            } catch (const std::exception& ex) {
                logger.log(lg::Error, "failed to initialize workflow suite: {}", ex.what());
                return EXIT_FAILURE;
            }
        }

        // if test is run for single testcase, overwrite suite with our own.

        if (options.count("testcase")) {
            suite = std::make_shared<SingleCaseSuite>(options.at("testcase"));
        } else if (options.count("testcase-file")) {
            suite = std::make_shared<FileSuite>(options.at("testcase-file"));
            suite->initialize();
        }

        // if workflow does not provide a suite, we choose not to proceed

        if (!suite) {
            logger.log(lg::Error, "workflow does not provide a suite");
            return EXIT_FAILURE;
        }

        // validate suite

        if (suite->size() == 0) {
            logger.log(lg::Error, "unable to proceed with empty list of testcases");
            return EXIT_FAILURE;
        }

        // iterate over testcases and execute the workflow for each testcase.

        Timer timer;
        Statistics stats;
        timer.tic("__workflow__");
        auto i = 0u;

        for (const auto& testcase : *suite) {
            ++i;
            auto outputDirCase = outputDirRevision / testcase;

            // unless option `overwrite` is specified, check if this
            // testcase should be skipped.

            if ((!options.count("overwrite") || options.at("overwrite") != "true") && workflow.skip(testcase)) {
                logger.log(lg::Info, "skipping already processed testcase: {}", testcase);
                stats.inc(ExecutionOutcome::Skip);
                printer.print(
                    " ({:>3} of {:<3}) {:<32} (skip)\n", i, suite->size(), testcase);
                continue;
            }

            // declare testcase to the client

            touca::declare_testcase(testcase);

            // remove result directory for this testcase if it already exists.

            if (touca::filesystem::exists(outputDirCase.string())) {
                touca::filesystem::remove_all(outputDirCase);
                logger.log(lg::Debug, "removed existing result directory for {}", testcase);

                // since subsequent operations may expect to write into
                // this directory, we wait a few milliseconds to ensure
                // it is created on disk.
                std::this_thread::sleep_for(std::chrono::milliseconds(10));
            }

            // create result directory for this testcase

            touca::filesystem::create_directories(outputDirCase);

            // execute workflow for this testcase

            logger.log(lg::Info, "processing testcase: {}", testcase);
            timer.tic(testcase);
            Errors errors;
            OutputCapturer capturer;
            if (options.at("stream-redirection") == "true") {
                capturer.start_capture();
            }

            try {
                errors = workflow.execute(testcase);
            } catch (const std::exception& ex) {
                errors = { ex.what() };
            } catch (...) {
                errors = { "unknown exception" };
            }

            if (options.at("stream-redirection") == "true") {
                capturer.stop_capture();
            }
            timer.toc(testcase);
            stats.inc(errors.empty() ? ExecutionOutcome::Pass : ExecutionOutcome::Fail);
            logger.log(lg::Info, "processed testcase: {}", testcase);

            // pipe stderr of code under test for this testcase into a file

            if (!capturer.cerr().empty()) {
                const auto resultFile = outputDirCase / "stderr.txt";
                touca::save_string_file(resultFile.string(), capturer.cerr());
            }

            // pipe stdout of code under test for this testcase into a file

            if (!capturer.cout().empty()) {
                const auto resultFile = outputDirCase / "stdout.txt";
                touca::save_string_file(resultFile.string(), capturer.cout());
            }

            // save testresults in binary format if configured to do so

            if (errors.empty() && options.count("save-as-binary") && options.at("save-as-binary") == "true") {
                const auto resultFile = outputDirCase / "touca.bin";
                touca::save_binary(resultFile.string(), { testcase });
            }

            // save testresults in json format if configured to do so

            if (errors.empty() && options.count("save-as-json") && options.at("save-as-json") == "true") {
                const auto resultFile = outputDirCase / "touca.json";
                touca::save_json(resultFile.string(), { testcase });
            }

            // submit testresults to Touca server

            if (!options.count("skip-post") && !touca::post()) {
                logger.log(lg::Error, "failed to submit results to Touca server");
            }

            // report testcase statistics

            printer.print(" ({:>3} of {:<3}) {:<32} ({}, {:d} ms)\n",
                i, suite->size(), testcase, errors.empty() ? "pass" : "fail",
                timer.count(testcase));
            for (const auto& err : errors) {
                printer.print("{:>13} {}\n\n", "-", err);
            }
            if (!errors.empty()) {
                printer.print("\n");
            }

            // now that we are done with this testcase, remove all results
            // associated with itfrom process memory.

            touca::forget_testcase(testcase);
        }

        // write test execution statistics as footer to the user report

        timer.toc("__workflow__");
        if (stats.count(ExecutionOutcome::Skip)) {
            printer.print(
                "\nskipped {} of {} testcases\n",
                stats.count(ExecutionOutcome::Skip), suite->size());
        }
        printer.print(
            "\nprocessed {} of {} testcases\ntest completed in {:d} ms\n\n",
            stats.count(ExecutionOutcome::Pass), suite->size(),
            timer.count("__workflow__"));

        // seal this version if configured to do so.

        if (!seal_version(options, logger)) {
            touca::print_warning("failed to seal this version\n");
        }

        logger.log(lg::Info, "application completed execution");
        return EXIT_SUCCESS;
    }

    /**
     *
     */
    int main(int argc, char* argv[], Workflow& workflow)
    {
        try {
            return main_impl(argc, argv, workflow);
        } catch (const std::exception& ex) {
            touca::print_error("aborting application: {}\n", ex.what());
            return EXIT_FAILURE;
        } catch (...) {
            touca::print_error("aborting application due to unknown error\n");
            return EXIT_FAILURE;
        }
    }

}} // namespace touca::framework
