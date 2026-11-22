# [1.8.0](https://github.com/databk/rustdesk-console-web/compare/1.7.0...1.8.0) (2026-11-22)


### Bug Fixes

* add --provenance=false to imagetools create for ACR ([#413](https://github.com/databk/rustdesk-console-web/issues/413)) ([c2c3fe4](https://github.com/databk/rustdesk-console-web/commit/c2c3fe43f0ff82ca2839209ad342a1af14183d4e))
* **custom-client:** remove redundant cancel button from build modal footer ([#416](https://github.com/databk/rustdesk-console-web/issues/416)) ([43bd7bd](https://github.com/databk/rustdesk-console-web/commit/43bd7bdaaf2d3921e815303badc135c7431c8863))
* disable provenance for ACR compatibility ([#412](https://github.com/databk/rustdesk-console-web/issues/412)) ([75eb65d](https://github.com/databk/rustdesk-console-web/commit/75eb65da072de0c40f9f8d3f95f12c890daf38ed))
* **i18n:** migrate nexus translation keys to customClient namespace ([#417](https://github.com/databk/rustdesk-console-web/issues/417)) ([76e2539](https://github.com/databk/rustdesk-console-web/commit/76e2539ebd642465cfbaaf8e931b679cd22352fe))
* **nginx:** auto-detect DNS resolver from /etc/resolv.conf ([#405](https://github.com/databk/rustdesk-console-web/issues/405)) ([dba37ae](https://github.com/databk/rustdesk-console-web/commit/dba37aec6c3fb7dcd9ac43583a0d231ac0e8ed7c))
* **nginx:** set client_max_body_size to 200m for large file uploads ([#421](https://github.com/databk/rustdesk-console-web/issues/421)) ([115fcdf](https://github.com/databk/rustdesk-console-web/commit/115fcdf07b0c57be75a9335bde5ea7f2fbe4ec3c))
* **nginx:** use ^~ for /api/ location to prevent regex override ([#420](https://github.com/databk/rustdesk-console-web/issues/420)) ([a4ebe24](https://github.com/databk/rustdesk-console-web/commit/a4ebe246a44ab9e711580d5c6f49fc367b562d58))
* replace imagetools with second build for ACR push ([#414](https://github.com/databk/rustdesk-console-web/issues/414)) ([06db5e5](https://github.com/databk/rustdesk-console-web/commit/06db5e5291115d180cf7f71ab7fe8e19e0db8c8c))
* **servers:** scope management actions to service instances ([#377](https://github.com/databk/rustdesk-console-web/issues/377)) ([aa20219](https://github.com/databk/rustdesk-console-web/commit/aa20219af0a0c4cb5c9203e254ca4c866c72db86))
* **strategy:** align config option keys with RustDesk client ([#399](https://github.com/databk/rustdesk-console-web/issues/399)) ([850fc81](https://github.com/databk/rustdesk-console-web/commit/850fc811fb2aab6bd87e6f71d272a1563e294c4c))
* use generator repo for GitHub Actions link in build list ([#427](https://github.com/databk/rustdesk-console-web/issues/427)) ([5f797e9](https://github.com/databk/rustdesk-console-web/commit/5f797e940a72e8c55b8b2f482ba57549f5a83f4c))
* use incremental data updates instead of full table reload during polling ([#426](https://github.com/databk/rustdesk-console-web/issues/426)) ([2ccf468](https://github.com/databk/rustdesk-console-web/commit/2ccf468abef0218e1c15cce21fb6773eebd02fcd))
* **web-client:** allow non-Windows peer platforms to connect ([#389](https://github.com/databk/rustdesk-console-web/issues/389)) ([af1f033](https://github.com/databk/rustdesk-console-web/commit/af1f0337cf3731aafbec11fe3ebc36cfa82b6891))


### Features

* add ACR Docker image push to CI workflows ([#411](https://github.com/databk/rustdesk-console-web/issues/411)) ([a236f90](https://github.com/databk/rustdesk-console-web/commit/a236f90bda383083e87f216f45134958fc6d5efc))
* **address-book:** connect to devices in browser from address book ([#383](https://github.com/databk/rustdesk-console-web/issues/383)) ([f500de6](https://github.com/databk/rustdesk-console-web/commit/f500de6d696d5863d92749b18ed3e05e9c8489d3))
* **audits:** show client IP and user agent of console audit records ([#425](https://github.com/databk/rustdesk-console-web/issues/425)) ([fa72b3f](https://github.com/databk/rustdesk-console-web/commit/fa72b3f1a2be599d13035c89c1244edaa364351b)), closes [databk/rustdesk-console#528](https://github.com/databk/rustdesk-console/issues/528)
* **custom-client:** add multi-step build flow with strategy config ([#415](https://github.com/databk/rustdesk-console-web/issues/415)) ([949c1be](https://github.com/databk/rustdesk-console-web/commit/949c1be4e04489f79639645a266cdee952d03219))
* **custom-client:** align build status with GitHub Actions conclusion ([#423](https://github.com/databk/rustdesk-console-web/issues/423)) ([423b392](https://github.com/databk/rustdesk-console-web/commit/423b392b3ede21754b65a2cfc2a78a4238cac252))
* **custom-client:** replace Nexus with custom client builder UI ([#396](https://github.com/databk/rustdesk-console-web/issues/396)) ([1057200](https://github.com/databk/rustdesk-console-web/commit/1057200b6610d35fae9a46bfd1fa1c825b436d83))
* **devices:** surface hbbs presence mismatches ([#408](https://github.com/databk/rustdesk-console-web/issues/408)) ([a3da84a](https://github.com/databk/rustdesk-console-web/commit/a3da84a9163fb0a79e176ae674e03f9aefd6316e))
* **devices:** wire column sorting to the device list API ([#409](https://github.com/databk/rustdesk-console-web/issues/409)) ([42ec066](https://github.com/databk/rustdesk-console-web/commit/42ec06680f2121374f5ade2b2bfca5245f446a19))
* **locale:** add es-ES (Spanish) language support ([#424](https://github.com/databk/rustdesk-console-web/issues/424)) ([922a682](https://github.com/databk/rustdesk-console-web/commit/922a6820f9b560a1a0bacb65d910f11a4c090185))
* **settings:** add device clone isolation toggle to general settings ([#394](https://github.com/databk/rustdesk-console-web/issues/394)) ([09164c3](https://github.com/databk/rustdesk-console-web/commit/09164c3b534942e88f62ea5e504f6402122726cf))
* **strategy:** add 16 missing strategy-supported config options ([#404](https://github.com/databk/rustdesk-console-web/issues/404)) ([0b48e57](https://github.com/databk/rustdesk-console-web/commit/0b48e570907b244c0bf27c939c0531fe6c34d45f))
* **strategy:** only show strategy-supported options on strategy page ([#400](https://github.com/databk/rustdesk-console-web/issues/400)) ([a71473a](https://github.com/databk/rustdesk-console-web/commit/a71473acd793fe74b6dfec07ca582484fe861ae2))
* **web-client:** add view camera support ([#395](https://github.com/databk/rustdesk-console-web/issues/395)) ([9ede609](https://github.com/databk/rustdesk-console-web/commit/9ede6092f33ce38b046362f716eb806f2f3dc443))
* **web-client:** add WebRTC P2P transport with relay fallback ([#390](https://github.com/databk/rustdesk-console-web/issues/390)) ([79773d3](https://github.com/databk/rustdesk-console-web/commit/79773d3aeaf7f67bd6cb700b23212874b2e0a313))



# [1.7.0](https://github.com/databk/rustdesk-console-web/compare/1.6.1...1.7.0) (2026-10-18)


### Bug Fixes

* align frontend API types with backend definitions ([#348](https://github.com/databk/rustdesk-console-web/issues/348)) ([23acde8](https://github.com/databk/rustdesk-console-web/commit/23acde89810a2b7639a9e46b67731252652c9a9e))
* **ci:** use App token for release push ([#354](https://github.com/databk/rustdesk-console-web/issues/354)) ([42ba610](https://github.com/databk/rustdesk-console-web/commit/42ba6101d75d0714648f5a869a4a83bdca0252ae))
* **dashboard:** use dashboard.view permission, add device name search and CSV export ([#357](https://github.com/databk/rustdesk-console-web/issues/357)) ([3752ae2](https://github.com/databk/rustdesk-console-web/commit/3752ae29c8ddedaef1aa667e17f2ba33cf22bdac)), closes [#415](https://github.com/databk/rustdesk-console-web/issues/415)
* **login:** render alternative login methods below the Login button ([#369](https://github.com/databk/rustdesk-console-web/issues/369)) ([60e0b29](https://github.com/databk/rustdesk-console-web/commit/60e0b29e0e61e18ea9a8cc4f62025fe9f51710f2))


### Features

* add hbbs and hbbr management dashboard ([#353](https://github.com/databk/rustdesk-console-web/issues/353)) ([1191035](https://github.com/databk/rustdesk-console-web/commit/11910356a94b4c40683ebaa2b73a07048465a32f))
* add one-click coordinated system updates to the WebUI ([#352](https://github.com/databk/rustdesk-console-web/issues/352)) ([290dc24](https://github.com/databk/rustdesk-console-web/commit/290dc240bddc079e81091976f83c7a64b0933642))
* **login:** add forgot-password flow with reset page ([#371](https://github.com/databk/rustdesk-console-web/issues/371)) ([36db500](https://github.com/databk/rustdesk-console-web/commit/36db5008602795e7e4e6e7405c5ee0e239055037))
* **settings:** add web client and server management settings pages ([#373](https://github.com/databk/rustdesk-console-web/issues/373)) ([6965ed2](https://github.com/databk/rustdesk-console-web/commit/6965ed2dd43db67ee3fbd057de23ae3fc649d50c))
* **web-client:** add an experimental browser remote control client ([#351](https://github.com/databk/rustdesk-console-web/issues/351)) ([c9f0e89](https://github.com/databk/rustdesk-console-web/commit/c9f0e89028c64d9b68015c61a30b60ebbde7082d))


### Reverts

* Revert "chore(deps-dev): bump @umijs/max from 4.7.22 to 4.7.23 (#363)" (#364) ([3c2c41f](https://github.com/databk/rustdesk-console-web/commit/3c2c41f86cc66f229fbf01f439c7f68bf78c6e5a)), closes [#363](https://github.com/databk/rustdesk-console-web/issues/363) [#364](https://github.com/databk/rustdesk-console-web/issues/364)



## [1.6.1](https://github.com/databk/rustdesk-console-web/compare/1.6.0...1.6.1) (2026-10-01)


### Bug Fixes

* respect backend pageSize limit of 100 in remaining callers ([#345](https://github.com/databk/rustdesk-console-web/issues/345)) ([c6305c9](https://github.com/databk/rustdesk-console-web/commit/c6305c94bf4f980b76c08e3ab8dec27c7f38ab8e))
* **users:** prevent system owner status and deletion actions ([#341](https://github.com/databk/rustdesk-console-web/issues/341)) ([a77a85f](https://github.com/databk/rustdesk-console-web/commit/a77a85f29ca46d498142c978199b1a2f80e2f711))
* **users:** remove obsolete admin toggle from edit user modal ([#340](https://github.com/databk/rustdesk-console-web/issues/340)) ([2254ac4](https://github.com/databk/rustdesk-console-web/commit/2254ac4efeb44a029d24826f27b7bb7d8d0f367e)), closes [#379](https://github.com/databk/rustdesk-console-web/issues/379)



# [1.6.0](https://github.com/databk/rustdesk-console-web/compare/1.5.1...1.6.0) (2026-09-27)


### Bug Fixes

* configure public path for GitHub Pages ([#323](https://github.com/databk/rustdesk-console-web/issues/323)) ([6d634ba](https://github.com/databk/rustdesk-console-web/commit/6d634baeffa25792737a797c658fe6f99e3395c4))
* **dashboard:** align trend card height with left cards ([#328](https://github.com/databk/rustdesk-console-web/issues/328)) ([cce6a7d](https://github.com/databk/rustdesk-console-web/commit/cce6a7d68fc74c0e24f9b88813c96e047a2a36a8))
* **dashboard:** fetch trend data on initial mount ([#327](https://github.com/databk/rustdesk-console-web/issues/327)) ([9c7d695](https://github.com/databk/rustdesk-console-web/commit/9c7d695b05bf32e782f2666c77229d11336c1e27))
* **dashboard:** improve color hierarchy and card readability ([#331](https://github.com/databk/rustdesk-console-web/issues/331)) ([146e40c](https://github.com/databk/rustdesk-console-web/commit/146e40c88f411fae8d5dd4b7a7be893ce6ac915b))
* **devices:** use case-sensitive connect URL and add connection method menu ([#320](https://github.com/databk/rustdesk-console-web/issues/320)) ([8c2861f](https://github.com/databk/rustdesk-console-web/commit/8c2861f51c3fd5ffbab72dd035e107e008f16318))
* **docker:** add --legacy-peer-deps flag to npm ci in Dockerfile ([#319](https://github.com/databk/rustdesk-console-web/issues/319)) ([f5569a6](https://github.com/databk/rustdesk-console-web/commit/f5569a60ce50abcf53c41b399eb7ea58dc560951)), closes [#317](https://github.com/databk/rustdesk-console-web/issues/317)
* **i18n:** replace hardcoded text in console audit page ([#334](https://github.com/databk/rustdesk-console-web/issues/334)) ([9ac019f](https://github.com/databk/rustdesk-console-web/commit/9ac019f733165b20db0c40d618d6c83c61c7af99))
* **locale:** include fr-FR in tests and ru-RU in language options ([#298](https://github.com/databk/rustdesk-console-web/issues/298)) ([d5c6cd6](https://github.com/databk/rustdesk-console-web/commit/d5c6cd6dfea7c18c514bb5cc9e7d20a4330037eb))
* **login:** use uniform 24px spacing between fields and the Passkey/Login buttons ([#335](https://github.com/databk/rustdesk-console-web/issues/335)) ([40dc789](https://github.com/databk/rustdesk-console-web/commit/40dc78964661f7df2f21bb53d25df4121d238c73))
* **oidc:** sanitize SVG icons with DOMPurify instead of data URI ([#312](https://github.com/databk/rustdesk-console-web/issues/312)) ([2956c44](https://github.com/databk/rustdesk-console-web/commit/2956c443938d2b8fde8e6fa0bc4988e7ac9124b9))
* remove incorrect CNAME and update logo to rustdesk official ([#330](https://github.com/databk/rustdesk-console-web/issues/330)) ([6f8ed58](https://github.com/databk/rustdesk-console-web/commit/6f8ed58ff3297066da7b7c51fd96701cb00f3f0c))
* remove SVG width/height attributes and strip empty URL fields ([#315](https://github.com/databk/rustdesk-console-web/issues/315)) ([046f2b2](https://github.com/databk/rustdesk-console-web/commit/046f2b2c6d0ba76166fbcbbd69aecead4c32990d))
* **roles:** remove index column from roles list table ([#303](https://github.com/databk/rustdesk-console-web/issues/303)) ([adbdcfb](https://github.com/databk/rustdesk-console-web/commit/adbdcfb2ca938f07126926915bde7cdff85ded31))
* **strategy:** remove builtin-only options from strategy page ([#301](https://github.com/databk/rustdesk-console-web/issues/301)) ([47fdfd9](https://github.com/databk/rustdesk-console-web/commit/47fdfd91d311d0b14f3733b6cb7713180b72ec72))
* support GitHub Pages routing ([#324](https://github.com/databk/rustdesk-console-web/issues/324)) ([983f628](https://github.com/databk/rustdesk-console-web/commit/983f6280b10ba4a6a594569d6cc00b48ed4273af))
* use cargo-cross for aarch64-musl build instead of musl.cc ([#310](https://github.com/databk/rustdesk-console-web/issues/310)) ([2582ef0](https://github.com/databk/rustdesk-console-web/commit/2582ef02b935b8ea2a665a0fb04befb2fa7fe40a))


### Features

* add musl binary build targets for x86_64 and aarch64 ([#309](https://github.com/databk/rustdesk-console-web/issues/309)) ([a9acb02](https://github.com/databk/rustdesk-console-web/commit/a9acb020fcc9f17949ebe29fc9d5bb4097c7eeb0))
* add Russian (ru-RU) localization ([#276](https://github.com/databk/rustdesk-console-web/issues/276)) ([b998b2e](https://github.com/databk/rustdesk-console-web/commit/b998b2e07a21fb7ed6c56c3bb8f379ca2de59340))
* **audit:** adapt frontend to new audit fields from backend ([#318](https://github.com/databk/rustdesk-console-web/issues/318)) ([7452a3c](https://github.com/databk/rustdesk-console-web/commit/7452a3c57ba669725f7fef6b61502d78513601c7))
* **audit:** expose console audit log ([#322](https://github.com/databk/rustdesk-console-web/issues/322)) ([44af1f7](https://github.com/databk/rustdesk-console-web/commit/44af1f76887b02e85167880b5e85aef4e352bd35))
* **dashboard:** redesign dashboard UI with ring charts, combined trend chart, and unified API ([#325](https://github.com/databk/rustdesk-console-web/issues/325)) ([4beb5fb](https://github.com/databk/rustdesk-console-web/commit/4beb5fbf16e1bc5a8e36ad00d4b0409a42626231)), closes [#13c2c2](https://github.com/databk/rustdesk-console-web/issues/13c2c2) [#361](https://github.com/databk/rustdesk-console-web/issues/361)
* **locale:** add fr-FR (French) language support ([#297](https://github.com/databk/rustdesk-console-web/issues/297)) ([e97776c](https://github.com/databk/rustdesk-console-web/commit/e97776cbf876e90d5fc848147444089ba29c7d11)), closes [#296](https://github.com/databk/rustdesk-console-web/issues/296)
* **oidc:** adapt monochrome icons to theme and strip preset field from API calls ([#313](https://github.com/databk/rustdesk-console-web/issues/313)) ([d82fe8a](https://github.com/databk/rustdesk-console-web/commit/d82fe8a24c097c6e6076b0dfe275bdcad30fa592))
* **oidc:** hide built-in config fields when selecting a preset provider ([#314](https://github.com/databk/rustdesk-console-web/issues/314)) ([fe530c8](https://github.com/databk/rustdesk-console-web/commit/fe530c864446e0b0f82d569c5bdd4c4044987f45))
* **oidc:** unify provider icons with client and support SVG upload ([#308](https://github.com/databk/rustdesk-console-web/issues/308)) ([9970d11](https://github.com/databk/rustdesk-console-web/commit/9970d11cf47acdada5a5d115cc372eee75214331))
* **rbac:** add permission-aware administration UI ([#281](https://github.com/databk/rustdesk-console-web/issues/281)) ([8b3a977](https://github.com/databk/rustdesk-console-web/commit/8b3a97703dca90908e7675298caed021619f56b3))
* **settings:** add jwtExpiryDays and auditRetentionDays to general settings ([#300](https://github.com/databk/rustdesk-console-web/issues/300)) ([8ad97e7](https://github.com/databk/rustdesk-console-web/commit/8ad97e7259a57306946a3d9d3cc89249e401804e))
* **settings:** use two-column masonry layout for general settings ([#321](https://github.com/databk/rustdesk-console-web/issues/321)) ([d9fd1ff](https://github.com/databk/rustdesk-console-web/commit/d9fd1ff26b2389cc1dfab013a2441d6d3f86393e))
* **strategy:** localize strategy configuration options ([#293](https://github.com/databk/rustdesk-console-web/issues/293)) ([265ece7](https://github.com/databk/rustdesk-console-web/commit/265ece73c03a34d079a9bbfc4228d2437606d632))
* **users:** add admin password reset in security modal ([#299](https://github.com/databk/rustdesk-console-web/issues/299)) ([d4c9c1e](https://github.com/databk/rustdesk-console-web/commit/d4c9c1e533b48dbb83cfbf17ef704ce5c1099774))



## [1.5.1](https://github.com/databk/rustdesk-console-web/compare/1.5.0...1.5.1) (2026-08-12)


### Bug Fixes

* **i18n:** add missing pt-BR translations and remove unused keys ([#270](https://github.com/databk/rustdesk-console-web/issues/270)) ([7c6249d](https://github.com/databk/rustdesk-console-web/commit/7c6249d1ea544fd92e5d8bcc818026e69215af3a))
* localize /user/center title via explicit route locale ([#265](https://github.com/databk/rustdesk-console-web/issues/265)) ([43b06ab](https://github.com/databk/rustdesk-console-web/commit/43b06ab9d8180f3ccef3dcf3ad324f9855716a09))
* prevent page title suffix from leaking into PageContainer ([#263](https://github.com/databk/rustdesk-console-web/issues/263)) ([d39b7f7](https://github.com/databk/rustdesk-console-web/commit/d39b7f78c2f9b020f5aa5388615411b09385daf6)), closes [#261](https://github.com/databk/rustdesk-console-web/issues/261)



