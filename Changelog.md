# Changelog

## v1.8.0

### Server

- collect user-agent upon submission (#502)
- accept API key as a custom header for SDK auth (#491)
- configure eslint rule for `ts-expect-error` (#493)
- fix mime lookup function (#492)
- improve formatting of result keys containing long strings (#489)
- account reset endpoint should not convert username to lowercase (#488)
- update password confirmation field on change (#487)
- use edit distance for string comparison scores (#484)
- web app should preserve filter preferences (#486)
- use same validators in suite settings page (#475)
- update server startup code (#471)
- add assumptions tab to test case page (#470)
- update result component (#469)
- send event after processing each message (#443)
- improve install wizard (#442)
- improve team create flow (#441)
- refactor pages in home module (#440)
- extend scope of server events (#439)
- simplify activity type (#438)
- extend server side events to team page (#437)
- publish event after each message comparison (#461)
- support `MONGO_URI` environment variable (#434)
- switch to using es modules (#424)
- skip recipe to upgrade buckets on cloud instance (#413)
- update flatbuffers generated files (#412)
- add basic support for custom comparison rules (#410)
- remove Cpp prefix from server types (#409)
- update job queue (#408)
- fix broken redis connection logic (#407)
- add class for redis client (#406)
- let redis handle connection retries (#405)
- pass redis connection to BullMQ (#404)
- upgrade dependency on BullMQ (#403)
- simplify type of server events job (#398)
- use server-sent events (#390)
- bust cache when suite subscription changes (#397)
- install script should stop asking name (#395)
- remove dependency on HubSpot (#391)
- disable HubSpot (#389)
- update open graph image (#380)
- remove unused function `getRedisUri` (#379)
- upgrade helm to use v1.8 (#378)
- enable trust proxy in cloud-hosted version (#374)
- change binary schema for blobs (#369)
- allow user to submit sample data to empty team (#370)
- route to populate account should take team as parameter (#368)
- remove artifact when message is removed (#367)
- bugfix to version auto-increment logic (#361)
- sort flattened values in comparison logic (#360)
- add basic image visualization support (#358)
- report invalid urls in log (#348)
- update object store status check (#346)
- store all objects in a single bucket (#345)

### Python CLI

- enable CLI `server` command to run on windows (#483)
- CLI `server` command should default to docker compose plugin (#482)
- CLI command `extract` should warn if out dir exists (#480)
- improve CLI startup time (#479)
- rewrite CLI `results` command for managing local results (#477)
- improve CLI `server logs` command (#465)
- CLI `server` command should support `logs` subcommands (#463)
- implement CLI `server` subcommand (#462)
- CLI `test` command should return error code if test fails (#428)
- CLI `check` command should use file names as testcases (#364)
- add CLI command `check` (#355)

### Python SDK

- test runner should warn if test case has no captured data (#481)
- sort imports (#474)
- rewrite options parsing logic (#473)
- update readme file (#460)
- bump development version to v1.8.2 (#454)
- update changelog (#453)
- add array elements in reverse (#372)
- switch to using local `flatc` (#366)
- remove duplicate examples (#363)
- allow passing list of testcases as code to workflow (#362)
- update changelog (#359)
- fix shadow local variable name (#356)
- add new computer vision example (#354)
- add additional python example for testing ml pipelines (#208)

### C++ SDK

- bump development version to v1.6.1 (#503)
- update changelog (#501)
- add API reference docs for the test runner (#500)
- remove `resultfile` class in favor of `deserialize_file` (#496)
- fix windows build (#495)
- update header file for catch2 plugin (#494)
- improve logic for parsing configuration options (#490)
- bump conan package version number (#478)
- remove `devkit` subdirectory (#340)
- move deserialization code to CLI (#450)
- bump development version to v1.6.0 (#452)
- update changelog for v1.5.2 (#451)
- update sample app (#421)
- remove duplicate examples in sdk directory (#415)
- move comparison logic for elements map (#393)
- update main example (#449)

### JavaScript SDK

- add comment block for run function (#472)
- update examples (#447)
- prepare for v1.6.3 release (#446)
- refactor sdk implementation (#436)
- update examples (#435)
- remove use of require in code (#433)
- update paths in esm package (#432)
- update changelog (#431)
- improve test coverage (#430)
- switch to using es modules (#429)
- add support for capturing binary blobs and external files (#423)
- add support for programmatic testcase declaration (#422)
- add support for custom comparison rules (#417)
- remove duplicate examples (#416)
- update generated schema file (#414)
- switch from lerna to using npm workspaces (#349)
- remove lerna from examples (#371)

### Java SDK

- update readme file (#459)
- bump development version to v1.5.3 (#457)
- update environment variables for gradle signing key (#456)
- update changelog (#455)
- add support for custom comparison rules (#420)
- update sample app files (#419)
- remove duplicate examples (#418)

### Documentation Website

- move pricing page to server category (#476)
- add instructions to use the helm chart (#468)
- improve self-hosting instructions (#467)
- rename image assets (#466)
- add instructions for disabling telemetry (#464)
- add gif for test output (#445)
- replace `ToucaImage` with `ThemedImage` component (#396)
- upgrade dependencies (#392)
- add pricing page (#375)
- add Ross to list of contributors (#351)
- remove terraform task from good first issues list (#347)

### Marketing Website

- update press kit (#387)
- remove old logo files (#385)
- add v1.5 logo (#384)
- add open graph image for jobs page (#383)
- add jobs page (#382)
- publish new changelog (#377)
- publish new changelog (#373)
- publish new changelog (#365)
- update pricing page (#353)
- publish new changelog (#352)

### Build System

- move CI workflow for deployments to the main workflow (#499)
- enable updating cloud instance on demand (#498)
- add basic CI workflow for ecs deployment (#497)
- CI for self-hosting should use the CLI (#485)
- remove common.sh script (#458)
- remove script for syncing examples (#448)
- simplify readme file (#444)
- update path filters (#427)
- CI job for server should copy package.json (#426)
- CI job for server should copy package.json (#426)
- update path to server docs in CI job (#425)
- update codecov action (#402)
- combine install scripts (#401)
- add `has_cli_option` function (#400)
- add uninstall script for self-hosted instances (#399)
- update github actions modules (#394)
- reduce docker image size (#388)
- use same logo everywhere (#386)
- start containers as current user (#357)
- bump server to 1.8.0 (#344)

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
