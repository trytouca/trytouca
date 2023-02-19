# Changelog

## v1.9.0

### Server

- Colorize insertions and deletions when visualizing differences (#609)
- Add synchronous comparison functionality (#560)
- Element page should react to server sent events (#535)
- Improve how performance changes are described (#527)
- Metrics tab should always show actual values and changes (#525)
- Replace username with email in all user-facing workflows (#612)
- Allow user to manually toggle dark mode (#606, #607)
- Allow user to reset password while logged in (#613)
- Fix side-by-side view for long strings in results tab (#567)
- Fix incorrect visualization of long strings with differences (#556)
- Fix comparison of common keys with different result types (#537)
- Fix error in batchRemove on Touca cloud (#522)
- Remove promotion events when version is removed (#520)
- Form for setting auto seal duration should accept human-friendly input (#617)
- Move submit button to team page (#557)
- Upgrade angular app (#506)
- Remove footer from settings page (#608)
- Clients should use same API endpoint for sealing as used by web app (#591)
- Integration tests should always set a fixed API Key (#534)
- Upgrade Integration tests dependencies (#628)
- Upgrade server dependencies (#580)
- Replace `nodemon` with `tsx` (#566)
- Remove access control header from server-sent event endpoints (#515)
- Remove dependency on `uuid` package (#514)
- Use consistent pattern for accessing request headers (#512)

### Python CLI

- Add new CLI command `login` (#592, #611)
- Add new CLI plugin `demo` (#555)
- Improve CLI command `run` (#599)
- Improve CLI command `check` (#528)
- CLI command `check` should handle single binary files (#521)
- Fix incorrect test runner output when running in async mode (#602)
- Remove dependency on `colorama` (#598)
- Remove dependency on `packaging` (#593)

### Python SDK

- Run tests in synchronous mode by default (#603)
- Fix incorrect reporting of runtime of more than 1 second (#524)
- Fix incorrect logic in the `seal` function (#517)
- Test runner output should include link to results on the server (#581)
- Verify credentials during configuration (#507)
- Use poetry for dependency management (#590)
- Fix `mypy` warnings (#589, #600)
- Upgrade dependency on touca-fbs (#586)
- Miscellaneous improvements (#561, #587, #622, #623)
- Remove extra machine learning example (#532)

### C++ SDK

- Add support for synchronous comparison (#583)
- Submit API Key as http header (#508)
- Test runner output should include link to results on the server (#581)
- Fix build on windows (#619)
- Support compiling with C++20 (#519)
- Fix invalid format string (#513)
- Update CI build matrix (#545)
- Miscellaneous improvements (#620, #621)

### JavaScript SDK

- Add support for synchronized comparison (#582)
- Test runner output should include link to results on the server (#581)
- Submit API Key as a custom HTTP header (#509)
- Miscellaneous improvements (#624, #625)

### Java SDK

- Add support for synchronous comparison (#584)
- Test runner output should include link to results on the server (#581)
- saveJson and saveBinary should handle paths with no parent (#542)
- Respect revision when specified on the command-line (#539)
- Improve logic for parsing configuration options (#523)
- Submit API Key as a custom HTTP header (#511)
- Upgrade dependencies (#540)
- Add comments for configuration options (#510)
- Miscellaneous improvements (#541, #626, #627)

### Documentation Website

- Add new page for server settings (#610)
- Add new page for sdk errors (#574)
- Add new section for setting API Key and URL (#573)
- Add new section for post-install wizard (#572)
- Add new page about methods for configuring sdks (#570)
- Add more content to concepts page (#562, #563)
- Add new page for configuring mail server (#552)
- Add new section for CLI command `run` (#548)
- Add quick links to intro page (#568)
- Rewrite getting started page about writing tests (#564)
- Rewrite quick start page (#558)
- Improve docs for CLI command `server` (#551)
- Update instructions for using github actions (#594)
- Promote installing CLI with brew (#588, #596)
- Move comparison rule to page for capturing results (#618)
- Move team management info to the server section (#549)
- Move best-practices content into other documents (#546)
- Split CLI docs into multiple pages (#547)
- Improve light mode color theme (#559)
- Improve dark mode color theme (#543)
- Update color of sidebar in mobile view (#550)
- Update screenshots for managing team (#615)
- Update screenshots for CLI test command (#597)
- Update feature matrix page (#571)
- Add synchronous comparison to feature matrix (#569)
- Rewrite first page (#554)
- Add screenshots for CLI command output (#553)
- Consolidate pages for installing SDKs (#544)
- Change filename extensions to mdx for consistency (#536)
- Replace FAQ page with explaining differences vs unit testing (#533)
- Remove readme files for basic sdk examples (#531)
- Remove redundant readme files (#530)
- Rewrite and reorganize SDK pages (#529)
- Update best practices document (#526)
- Remove instructions for installing docker and docker compose (#518)
- Remove unused screenshots (#604)
- Add script for generating tutorial inputs (#565)

### Marketing Website

- Remove excessive whitespace on landing page (#605)
- Upgrade dependencies (#575)

### Build System

- Use Touca plugins for Github Actions (#576, #578)
- Upgrade CI and production environments to use node18 and ubuntu22 (#616)
- Improved CI workflows (#579, #601)
- Rewrite license linter script in python (#538)
- Add Readme file to touca-fbs sdist (#585)
- Miscellaneous improvements (#505, #577, #614)

**Full Changelog**: https://github.com/trytouca/trytouca/compare/v1.8.0...v1.9.0

## v1.8.0

### Server

- Added support for image visualization (#358)
- Added support for custom comparison rules (#410)
- Added support for server-sent events (#390, #398, #437, #439, #443)
- Added assumptions tab to test case page (#470)
- Improved support for visualizing long texts as data points (#489)
- Improved Redis connection logic (#379, #404, #405, #406, #407)
- Improved usage of Redis-backed queues (#403, #404, #408)
- Improved server install wizard (#442)
- Improved team creation workflow (#441)
- Improved server startup code (#471)
- Accept API key as a custom header for SDK auth (#491)
- Preserve filter preferences in web app (#486)
- Use edit distance for string comparison scores (#484)
- Removed HubSpot in-app chat widget (#389, #391)
- Store all objects in a single bucket (#345)
- Switch to using ESModules (#424)
- Collect user-agent upon submission (#502)
- Fix mime lookup function (#492)
- Account reset endpoint should not convert username to lowercase (#488)
- Web app should update password confirmation field on change (#487)
- Use same validators in suite settings page (#475)
- Update result component (#469)
- Refactor pages in home module (#440)
- Simplify activity type (#438)
- Publish event after each message comparison (#461)
- Support `MONGO_URI` environment variable (#434)
- Skip recipe to upgrade buckets on cloud instance (#413)
- Server should bust cache when suite subscription changes (#397)
- Upgrade helm to use v1.8 (#378)
- Enable trust proxy in cloud-hosted version (#374)
- Improved Flatbuffers binary schema (#369, #412)
- Allow user to submit sample data to empty team (#370)
- Improve endpoint for populating an account with results data (#368)
- Server should remove artifact when message is removed (#367)
- Improved logic for finding next version of a given suite (#361)
- Sort flattened values in comparison logic (#360)
- Report any invalid URLs in the server log (#348)
- Update object store status check (#346)
- Miscellaneous improvements (#380, #409, #493)

### Python CLI

- Added new CLI command: `server` (#462, #463, #465, #482, #483)
- Added new CLI command: `check` (#355, #364)
- Improved CLI command: `extract` (#480)
- Improved CLI command: `results` (#477)
- Improved CLI command: `test` (#428)
- Improved CLI startup time (#479)

### Python SDK

- Fixed reporting of array elements to follow their order of insertion (#372)
- Added test runner support programmatic declaration of test cases (#362)
- Added test runner should warn if test case has no captured data (#481)
- Improve test runner logic for handling configuration parameters (#473)
- Improved examples (#208, #354, #363)
- Miscellaneous improvements (#356, #359, #366, #453, #454, #460, #474)

### C++ SDK

- Improved test runner handling of configuration parameters (#490, #495, #496)
- Improved plugin for Catch2 test framework (#494)
- Improved API Reference documentation (#500)
- Improved examples (#415, #421, #449)
- Miscellaneous improvements (#340, #393, #450, #451, #452, #478, #501, #503)

### JavaScript SDK

- Publish library as pure ESM (#429, #432, #433)
- Added test runner support for capturing binary blobs and external files (#423)
- Added test runner support for programmatic declaration of test case (#422)
- Added test runner support for custom comparison rules (#414, #417)
- Improved test runner handling of configuration parameters (#436, #472)
- Improved test coverage (#430)
- Improve examples (#416, #435, #447)
- Switch from using Lerna to npm workspaces for JavaScript examples (#349, #371)
- Miscellaneous improvements (#431, #446)

### Java SDK

- Add support for custom comparison rules (#420)
- Improved examples (#418, #419)
- Miscellaneous improvements (#455, #456, #457, #459)

### Documentation Website

- Add instructions for using the helm chart (#468)
- Add instructions for disabling telemetry (#464)
- Add explanation about Touca Enterprise pricing (#375, #476)
- Improve self-hosting instructions (#467, #468)
- Miscellaneous improvements (#347, #351, #392, #396, #445, #466)

### Marketing Website

- Added new jobs page (#382, #383)
- Added new changelog posts (#352, #365, #373, #377)
- Updated pricing page (#353)
- Updated press kit (#387)
- Update brand assets (#384, #385)

### Build System

- Reduce docker image size (#388)
- Start containers as current user (#357)
- Enabled continuous deployment of Touca Cloud (#498)
- Improved self-hosting bash scripts (#395, #399, #400, #401, #458)
- Improved CI workflows (#394, #425, #426, #427, #485, #497, #499)
- Miscellaneous improvements (#344, #386, #402, #444, #448)

**Full Changelog**: https://github.com/trytouca/trytouca/compare/v1.7.0...v1.8.0

## v1.7.0

### Server

- use structured logs in cloud mode (#343)
- fix e2e setup code for clearing buckets (#342)
- fix race condition in message ingestion logic (#341)
- sort rows in account list (#325)
- continue applying mail server env vars (#322)
- remove deprecated fields from database (#321)
- use uuid from meta when reporting self-hosted installs (#320)
- add separate route to relay self-hoted installs (#319)
- change feedback processing route (#318)
- add route to relay telemetry (#316)
- update root url in cloud hosted mode (#313)
- skip serving static files in cloud-hosted mode (#312)
- do not create log file by default (#309)
- report perfect score when comparing empty messages (#307)
- fix status check logic in install script (#302)
- convert server to single docker image (#289)
- remove comparator component (#267)

### Documentation Website

- consolidate quickstart files (#328)
- add instructions for new CLI subcommand results (#326)

### Marketing Website

- publish new changelog (#327)
- publish new changelog (#315)

### Python SDK

- add new CLI sub-command `result` (#324)

### JavaScript SDK

- bump development version to v1.5.7 (#339)
- support configuration profiles (#338)
- bump development version to v1.5.6 (#337)
- add support for automatic version increments (#336)
- change default output directory (#333)
- enable running multiple workflows (#332)
- update dependencies (#329)

### Build System

- change public ecr repo for docker image (#310)
- update manifest and helm chart to use v1.7 (#304)
- bump server to v1.7.0 (#299)

**Full Changelog**: https://github.com/trytouca/trytouca/compare/v1.6.0...v1.7.0

## v1.6.0

### Server

- fix comparison of empty objects (#296)
- add new comparison logic (#294)
- add analytics for team member management (#290)
- reformat index html files (#284)
- create account during install wizard (#283)
- refactor analytics collection (#282)
- simplify analytics collection (#281)
- integrate customer.io (#276)
- add experimental comparison service (#266)

### Python SDK

- improved progress update logic in CLI subcommand zip (#291)
- refactor CLI subcommand zip (#288)
- add default src directory for CLI subcommand post (#287)
- refactor CLI subcommand post (#286)
- add help command (#279)
- remove init from api reference docs (#278)
- use rich text for config, profile, and plugin CLI commands (#277)
- use next batch if not specified (#274)
- bump development version to v1.5.8 (#268)
- add release notes for v1.5.7 (#265)

### C++ SDK

- enable deserializing results with no team slug (#285)

### Marketing Website

- publish new changelog (#292)
- remove intercom (#280)
- publish new changelog (#275)
- add intercom (#269)

### Build System

- remove unnecessary git fetch tags (#298)
- CI should build api when packages are changed (#297)
- CI should build comparator package (#295)
- change path to external docs (#273)
- remove CI step to deploy ops directory (#272)
- add build-ops job to CI (#271)
- add helm chart and manifest files for kubernetes deployment (#270)
- bump development version to v1.6.0 (#264)
- bump server to v1.5.0 (#263)

**Full Changelog**: https://github.com/trytouca/trytouca/compare/v1.5.0...v1.6.0
