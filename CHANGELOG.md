# [1.2.0](https://github.com/databk/rustdesk-console-web/compare/1.1.2...1.2.0) (2026-06-14)


### Bug Fixes

* use explicit version tags for Docker images ([#155](https://github.com/databk/rustdesk-console-web/issues/155)) ([3dbc6f8](https://github.com/databk/rustdesk-console-web/commit/3dbc6f8468d03189998fb39cb26d56eba9defcae))


### Features

* add LDAP configuration settings page ([#153](https://github.com/databk/rustdesk-console-web/issues/153)) ([9754767](https://github.com/databk/rustdesk-console-web/commit/9754767baeff06c9f2f9d23d228e0abea1c25452))
* display user avatar in header navigation bar ([#150](https://github.com/databk/rustdesk-console-web/issues/150)) ([2cdba60](https://github.com/databk/rustdesk-console-web/commit/2cdba6051202f92739c8bcd3dfe5d5d72add9273))
* implement alarm audit query and extract shared name@ip logic ([#151](https://github.com/databk/rustdesk-console-web/issues/151)) ([669aa13](https://github.com/databk/rustdesk-console-web/commit/669aa137e0bed2b83cc00b742f59e846c0a92465))
* update release workflow to auto-generate version ([#154](https://github.com/databk/rustdesk-console-web/issues/154)) ([cd298ad](https://github.com/databk/rustdesk-console-web/commit/cd298adce8eaf7dc41a66e855c163c8b1fa2a771))



## [1.1.2](https://github.com/databk/rustdesk-console-web/compare/1.1.1...1.1.2) (2026-06-07)


### Bug Fixes

* hide SettingDrawer in production environment ([#143](https://github.com/databk/rustdesk-console-web/issues/143)) ([7b00e05](https://github.com/databk/rustdesk-console-web/commit/7b00e05fe591741f137ae4f7b0f145bb86356f5f))



## [1.1.1](https://github.com/databk/rustdesk-console-web/compare/1.1.0...1.1.1) (2026-06-07)


### Features

* add nginx reverse proxy config and docker-compose setup ([#141](https://github.com/databk/rustdesk-console-web/issues/141)) ([036f407](https://github.com/databk/rustdesk-console-web/commit/036f40731ee4375b31408058c9ffd292e6f9ad2a))



# [1.1.0](https://github.com/databk/rustdesk-console-web/compare/1.0.0...1.1.0) (2026-06-06)


### Bug Fixes

* **audit:** correct file audit search field to use deviceId ([#107](https://github.com/databk/rustdesk-console-web/issues/107)) ([c087fdc](https://github.com/databk/rustdesk-console-web/commit/c087fdc27141b8be91cd58a8ae23cc5c2b0ad5c4))
* **audit:** update connection audit note API to PATCH /audits/conn/:id ([#118](https://github.com/databk/rustdesk-console-web/issues/118)) ([2102aea](https://github.com/databk/rustdesk-console-web/commit/2102aea7e490c0e6be803cea194c9aa13b4f7ca3))
* **audit:** update disconnect API to POST /devices/:uuid/disconnect ([#119](https://github.com/databk/rustdesk-console-web/issues/119)) ([4aec270](https://github.com/databk/rustdesk-console-web/commit/4aec270d5fd1d6d1125451d32390b5827cbc9c70))
* **i18n:** add missing offline duration time unit translations ([#106](https://github.com/databk/rustdesk-console-web/issues/106)) ([a4a32e6](https://github.com/databk/rustdesk-console-web/commit/a4a32e6520fe9b2b4ca6f71248db5c31e8ba9172))
* **i18n:** add missing translation keys and remove unused ones ([#117](https://github.com/databk/rustdesk-console-web/issues/117)) ([c13c6d8](https://github.com/databk/rustdesk-console-web/commit/c13c6d8b23ac131070fefaf32a6c9a957030b152))
* skip global error handler for login API ([#131](https://github.com/databk/rustdesk-console-web/issues/131)) ([c22c05d](https://github.com/databk/rustdesk-console-web/commit/c22c05d292e08bf20f617d4618566e04cd85b110))
* skip global error handler for SMTP config API ([#132](https://github.com/databk/rustdesk-console-web/issues/132)) ([6b9848b](https://github.com/databk/rustdesk-console-web/commit/6b9848bf411dc6ecbbd075b065c886309b55b52f))
* update footer copyright and links ([#139](https://github.com/databk/rustdesk-console-web/issues/139)) ([ba97560](https://github.com/databk/rustdesk-console-web/commit/ba975605123a700f3f128c46643b35f3ad46c039))


### Features

* **account:** add account center page for user profile management ([#133](https://github.com/databk/rustdesk-console-web/issues/133)) ([bc778ab](https://github.com/databk/rustdesk-console-web/commit/bc778ab2d3b2d66d2c6d7c024cdedae000ddd36c))
* **account:** add change password feature ([#138](https://github.com/databk/rustdesk-console-web/issues/138)) ([a5c0354](https://github.com/databk/rustdesk-console-web/commit/a5c03548232714c33a550436d9ca9c82ec21d8cd))
* add OIDC providers management page ([#122](https://github.com/databk/rustdesk-console-web/issues/122)) ([74a8784](https://github.com/databk/rustdesk-console-web/commit/74a8784cc3865c5c44a7f51787c9465180199d69))
* **audit:** enhance connection audit page ([#109](https://github.com/databk/rustdesk-console-web/issues/109)) ([e0a9d05](https://github.com/databk/rustdesk-console-web/commit/e0a9d05a5c8dc85452e0631aea5e6320ee99332d)), closes [#999](https://github.com/databk/rustdesk-console-web/issues/999)
* **devices:** update delete API and add edit device feature ([#136](https://github.com/databk/rustdesk-console-web/issues/136)) ([7d5dce7](https://github.com/databk/rustdesk-console-web/commit/7d5dce703d8446c9bb7155e511258e5aa5f7616a))
* **login:** implement full login flow with email verification, TFA, and OIDC support ([#108](https://github.com/databk/rustdesk-console-web/issues/108)) ([d2a177c](https://github.com/databk/rustdesk-console-web/commit/d2a177c72f1dd7763ed4bacbbecacc81ae18a7b6)), closes [#1890](https://github.com/databk/rustdesk-console-web/issues/1890) [#110](https://github.com/databk/rustdesk-console-web/issues/110) [#111](https://github.com/databk/rustdesk-console-web/issues/111)
* **login:** implement OIDC login with GitHub, GitLab and Google ([#121](https://github.com/databk/rustdesk-console-web/issues/121)) ([2858e3f](https://github.com/databk/rustdesk-console-web/commit/2858e3fe24bc27602014949bb8715166cbe8a271))
* persist remember me checkbox state ([#115](https://github.com/databk/rustdesk-console-web/issues/115)) ([57fd6d3](https://github.com/databk/rustdesk-console-web/commit/57fd6d3a0d2f1c4375efc2cef4f4c0bff7a4eea4))
* **strategy:** add strategy assignments API and update assigned targets display ([#135](https://github.com/databk/rustdesk-console-web/issues/135)) ([7271645](https://github.com/databk/rustdesk-console-web/commit/7271645e50bc911fe572a284c84a000f1a7fc176))
* **strategy:** add strategy management page ([#123](https://github.com/databk/rustdesk-console-web/issues/123)) ([0506575](https://github.com/databk/rustdesk-console-web/commit/0506575ca570bedb776bf06ba449cbfb2d333a34))
* **users:** implement full user management with admin API ([#134](https://github.com/databk/rustdesk-console-web/issues/134)) ([3b6a89c](https://github.com/databk/rustdesk-console-web/commit/3b6a89c67c93b1532060181c3c59ae8050de5fdf))



# [1.0.0](https://github.com/databk/rustdesk-console-web/compare/c19b893def0142e93cdad3c56ca2d09026da9cc8...1.0.0) (2026-05-22)


### Bug Fixes

* **address-book:** adjust search button order to Reset then Query ([#36](https://github.com/databk/rustdesk-console-web/issues/36)) ([a911060](https://github.com/databk/rustdesk-console-web/commit/a911060081035b4e3928cb4ab0dd5e4888cf3ba4))
* **address-book:** auto-close color picker when mouse leaves dot or panel ([#46](https://github.com/databk/rustdesk-console-web/issues/46)) ([88f0f07](https://github.com/databk/rustdesk-console-web/commit/88f0f07f9c4fe6d08df7132aa6ee7fa0bc1f8b81))
* **address-book:** resolve 400 error when adding device and fix React key duplicates ([#21](https://github.com/databk/rustdesk-console-web/issues/21)) ([0e40e30](https://github.com/databk/rustdesk-console-web/commit/0e40e3046eef512b999a9df2beb9bd1b1bfdb3fe))
* **address-book:** serialize tags as repeated query params ([#45](https://github.com/databk/rustdesk-console-web/issues/45)) ([eb83c22](https://github.com/databk/rustdesk-console-web/commit/eb83c22bafee8abfa1f6e0f8426fe11a6c12101f))
* align API request formats with backend specifications ([#20](https://github.com/databk/rustdesk-console-web/issues/20)) ([195498c](https://github.com/databk/rustdesk-console-web/commit/195498cde296de354da66b9ad3d20070b8521f2f))
* audit pages field mapping to match backend API ([#17](https://github.com/databk/rustdesk-console-web/issues/17)) ([4bf249e](https://github.com/databk/rustdesk-console-web/commit/4bf249e9945a1c076688a3703585d276efc37330))
* **auth:** resolve multi-tab login state sync and auth issues ([#68](https://github.com/databk/rustdesk-console-web/issues/68)) ([2c18a70](https://github.com/databk/rustdesk-console-web/commit/2c18a70839d51044d71c796c18821479fe7be8ca))
* change pagination parameter from 'page' to 'current' for shared address books API ([#4](https://github.com/databk/rustdesk-console-web/issues/4)) ([df598c9](https://github.com/databk/rustdesk-console-web/commit/df598c99a7691936c590e161cccfc5ecf46b3875))
* correct API parameter names to match backend requirements ([#10](https://github.com/databk/rustdesk-console-web/issues/10)) ([76f0bfa](https://github.com/databk/rustdesk-console-web/commit/76f0bfa703835f4c72eddcf3fac42eceba3116a9))
* **device-group:** fix remove device API format and add batch remove support ([#98](https://github.com/databk/rustdesk-console-web/issues/98)) ([c4b9a89](https://github.com/databk/rustdesk-console-web/commit/c4b9a8975e92cf05094cd8077cf12a7b9ed9ca0f))
* disable mock and add missing i18n translations ([#14](https://github.com/databk/rustdesk-console-web/issues/14)) ([511731c](https://github.com/databk/rustdesk-console-web/commit/511731c5f0c496d6ead18d0ef1fc8e4edb4450c1))
* enable toolbar options for device list table ([#77](https://github.com/databk/rustdesk-console-web/issues/77)) ([f855598](https://github.com/databk/rustdesk-console-web/commit/f8555989e0431075f8e2f1e6fd1b4e719f0abdbb))
* **i18n:** 补充缺失的国际化翻译 ([#23](https://github.com/databk/rustdesk-console-web/issues/23)) ([0f3f98b](https://github.com/databk/rustdesk-console-web/commit/0f3f98bd4b76d9898308e2f69ddf38dbf3672c7c))
* improve address book add device and remove duplicate route ([#19](https://github.com/databk/rustdesk-console-web/issues/19)) ([1a5a027](https://github.com/databk/rustdesk-console-web/commit/1a5a027a71eb630c0b47290a5a3fadce0c1a8b8a))
* improve SMTP error handling by using global error handler ([#62](https://github.com/databk/rustdesk-console-web/issues/62)) ([fde68a2](https://github.com/databk/rustdesk-console-web/commit/fde68a2cf9305056827654070ed4788e47479fd9))
* integrate search functionality with backend API ([#8](https://github.com/databk/rustdesk-console-web/issues/8)) ([8c1a013](https://github.com/databk/rustdesk-console-web/commit/8c1a013ff12eeb8f17605c83799fb1ebc6894a65))
* login token not saved and add welcome page i18n ([#15](https://github.com/databk/rustdesk-console-web/issues/15)) ([3cdd120](https://github.com/databk/rustdesk-console-web/commit/3cdd12030783b283114a46037844288f43957900))
* **polish:** complete i18n translations and cleanup ([451c7ae](https://github.com/databk/rustdesk-console-web/commit/451c7ae7331d8dbb276ee432e91dddc67643835a))
* resolve all TypeScript errors in codebase ([#63](https://github.com/databk/rustdesk-console-web/issues/63)) ([786db2b](https://github.com/databk/rustdesk-console-web/commit/786db2b10527294e41e5edbf5d30f8cd21ab73c0))
* resolve Biome lint errors ([#76](https://github.com/databk/rustdesk-console-web/issues/76)) ([857408a](https://github.com/databk/rustdesk-console-web/commit/857408a29848c3dada85f1691c1a4e40f5d6f412))
* resolve page stuck on 'Umi Loading...' issue ([5322416](https://github.com/databk/rustdesk-console-web/commit/5322416780b035c5e2fd56499dca2e85be5e9327))
* resolve remaining Ant Design 5.x best practice violations from PR [#70](https://github.com/databk/rustdesk-console-web/issues/70) ([#71](https://github.com/databk/rustdesk-console-web/issues/71)) ([7caeb02](https://github.com/databk/rustdesk-console-web/commit/7caeb02466b924988e925f26bfdf62a1bc29c98e)), closes [#1890](https://github.com/databk/rustdesk-console-web/issues/1890) [#1677](https://github.com/databk/rustdesk-console-web/issues/1677) [#ff4d4](https://github.com/databk/rustdesk-console-web/issues/ff4d4)
* restore corrupted address-book/shared/index.tsx file ([d76dd45](https://github.com/databk/rustdesk-console-web/commit/d76dd454b6777da3e4dc1a4ede1e791b1603da7f))
* **tsconfig:** migrate deprecated baseUrl and moduleResolution options ([#92](https://github.com/databk/rustdesk-console-web/issues/92)) ([441f57e](https://github.com/databk/rustdesk-console-web/commit/441f57ea27c2f3f873f7418f1072419eb947891d))
* unify table index column background color across all rows ([#18](https://github.com/databk/rustdesk-console-web/issues/18)) ([1c0ddfe](https://github.com/databk/rustdesk-console-web/commit/1c0ddfedd59d4df1d2bbdb0e1a9b4bc3788b410d))
* use correct icon name for audit logs menu ([#5](https://github.com/databk/rustdesk-console-web/issues/5)) ([d349617](https://github.com/databk/rustdesk-console-web/commit/d3496179e7f3ae0c6d59c7b965289f18fc846b25))


### Features

* add additional UI routes and type definitions ([#13](https://github.com/databk/rustdesk-console-web/issues/13)) ([e25d89d](https://github.com/databk/rustdesk-console-web/commit/e25d89dd46232ea3c9425dbd0c14c3563693bd1c))
* add Docker image publishing to GHCR and Docker Hub ([#96](https://github.com/databk/rustdesk-console-web/issues/96)) ([742d6b7](https://github.com/databk/rustdesk-console-web/commit/742d6b75b86a54b87a7cbaf334b0ab6ec1066e9f))
* add SMTP configuration settings ([#60](https://github.com/databk/rustdesk-console-web/issues/60)) ([e232583](https://github.com/databk/rustdesk-console-web/commit/e23258369300d389564d8137661f5188431e3116))
* **address-book:** add color dot with hover color picker and delete confirmation for tags ([#43](https://github.com/databk/rustdesk-console-web/issues/43)) ([b7d446d](https://github.com/databk/rustdesk-console-web/commit/b7d446d739c4470e728bf25660e77ae7cc23d7d5))
* **address-book:** add device import functionality for personal address book ([#47](https://github.com/databk/rustdesk-console-web/issues/47)) ([6625442](https://github.com/databk/rustdesk-console-web/commit/66254422d9bcf02e1cdc87d8accb5a6fbd6fe4ca))
* **address-book:** add info-circle icon and sorting to Device column ([#31](https://github.com/databk/rustdesk-console-web/issues/31)) ([0a803af](https://github.com/databk/rustdesk-console-web/commit/0a803af1aa4127ecd4a3b43185cf36bbeed808e7))
* **address-book:** add peer editing and comprehensive tag management ([#22](https://github.com/databk/rustdesk-console-web/issues/22)) ([9290141](https://github.com/databk/rustdesk-console-web/commit/9290141d3e09cf9c2af4186f5f2dfc0a3c4c0b41))
* **address-book:** add shared address book detail page ([#66](https://github.com/databk/rustdesk-console-web/issues/66)) ([4027b12](https://github.com/databk/rustdesk-console-web/commit/4027b12497390e2ce7d20400b094cffdb1c2bb27))
* **address-book:** add sorting to Alias and Note columns ([#32](https://github.com/databk/rustdesk-console-web/issues/32)) ([e9789f8](https://github.com/databk/rustdesk-console-web/commit/e9789f8adbb9136b1e648a1057af1002bcc1ebdd))
* **address-book:** add tag color dot with hover color picker and delete confirmation ([#42](https://github.com/databk/rustdesk-console-web/issues/42)) ([26f7976](https://github.com/databk/rustdesk-console-web/commit/26f7976ff8bc8cea9578a128bf6820e30f8950eb))
* **address-book:** add tags area with filter and delete support ([#27](https://github.com/databk/rustdesk-console-web/issues/27)) ([3650adb](https://github.com/databk/rustdesk-console-web/commit/3650adba51f191e603b2094d6d7398c8cb07d536))
* **address-book:** enhance address book with CRUD and tag management ([41f90d4](https://github.com/databk/rustdesk-console-web/commit/41f90d41115509470c7cd9d5c6971531b285dad5))
* **address-book:** make ID column sortable and remove copy button ([#30](https://github.com/databk/rustdesk-console-web/issues/30)) ([ef4664d](https://github.com/databk/rustdesk-console-web/commit/ef4664d94825d237183851cda6a5609dcf101a5b))
* **address-book:** support multi-tag filtering with union/intersection mode ([#44](https://github.com/databk/rustdesk-console-web/issues/44)) ([0f0f095](https://github.com/databk/rustdesk-console-web/commit/0f0f095a00c45c5416ac0d958bc74bfd0415affe))
* **address-book:** unify device column display with device management page ([#64](https://github.com/databk/rustdesk-console-web/issues/64)) ([7ac57e0](https://github.com/databk/rustdesk-console-web/commit/7ac57e01fce8951b4204de4f695a7e174fced9dd))
* **audits:** enhance audit pages with colored tags and scroll ([80b5ca6](https://github.com/databk/rustdesk-console-web/commit/80b5ca6c156ce7f77229fe81c241226bcc55ccfb))
* customize project for RustDesk Console ([c19b893](https://github.com/databk/rustdesk-console-web/commit/c19b893def0142e93cdad3c56ca2d09026da9cc8))
* **dark-mode:** enable theme settings with persistence ([aa9feef](https://github.com/databk/rustdesk-console-web/commit/aa9feeff8b1f92591b8b1a9eb249ad93a5cabb47))
* **dashboard:** enhance API utilization and data refresh strategy ([#55](https://github.com/databk/rustdesk-console-web/issues/55)) ([1b4b710](https://github.com/databk/rustdesk-console-web/commit/1b4b710a0ad0951d5b278380e8c6a31983bcd3d9))
* **dashboard:** implement workplace page with live statistics ([268fb79](https://github.com/databk/rustdesk-console-web/commit/268fb79f5cba829dcfddb6237dfe20d11c563417))
* **dashboard:** optimize layout and data visualization ([#57](https://github.com/databk/rustdesk-console-web/issues/57)) ([dead525](https://github.com/databk/rustdesk-console-web/commit/dead525f6fefa1d4ac4c5776f25db96d2b58909e))
* **device-groups:** add device import functionality ([#97](https://github.com/databk/rustdesk-console-web/issues/97)) ([ea92a5a](https://github.com/databk/rustdesk-console-web/commit/ea92a5aa47e013a7daa86ea098eb07b9b731c9bc))
* **device-groups:** enhance device group with CRUD and edit modal ([a6ccadb](https://github.com/databk/rustdesk-console-web/commit/a6ccadb4056ca201ef43f11a4fc965e7e7b2500f))
* **devices:** align device list with reference RustDesk Server Pro UI ([#39](https://github.com/databk/rustdesk-console-web/issues/39)) ([128a739](https://github.com/databk/rustdesk-console-web/commit/128a73943418f52fa59ed00183cebd64d7a171bd))
* **devices:** enhance device list with filters and actions ([2e441af](https://github.com/databk/rustdesk-console-web/commit/2e441af7bb4aac26c0e9be10775d3a19e5133bbc))
* **devices:** enhance device table with OS icons and improved column layout ([#48](https://github.com/databk/rustdesk-console-web/issues/48)) ([e3bdf28](https://github.com/databk/rustdesk-console-web/commit/e3bdf28ee67bafb32830d7ffe45e1d190892b7ed))
* **devices:** implement batch status update for devices ([#101](https://github.com/databk/rustdesk-console-web/issues/101)) ([f617718](https://github.com/databk/rustdesk-console-web/commit/f6177184702cd8ea9cc155de7cb193acb25ef807))
* implement device group navigation feature ([#69](https://github.com/databk/rustdesk-console-web/issues/69)) ([b3f5942](https://github.com/databk/rustdesk-console-web/commit/b3f59421a1a543cdd2949bc3a110606af0fcbcad))
* implement missing pages for backend-supported features ([#11](https://github.com/databk/rustdesk-console-web/issues/11)) ([c325532](https://github.com/databk/rustdesk-console-web/commit/c3255329e1291ce0e5e86b008fbd9d4f84d8779d))
* improve UI consistency and enhance features to match target website ([#9](https://github.com/databk/rustdesk-console-web/issues/9)) ([e651343](https://github.com/databk/rustdesk-console-web/commit/e65134367271e917aaf6c37dca5cbf20f2e6d4d7))
* improve UI consistency with target website ([#6](https://github.com/databk/rustdesk-console-web/issues/6)) ([799e8e8](https://github.com/databk/rustdesk-console-web/commit/799e8e8c891489937c0aec5f9c6f304fe257e8c0))
* **layout:** change default navigation mode to mix ([#41](https://github.com/databk/rustdesk-console-web/issues/41)) ([1cebcbc](https://github.com/databk/rustdesk-console-web/commit/1cebcbc91be7ce66f6ae3349c71b05e7ab42a28b))
* optimize file audit page with search, detail drawer and better UX ([#72](https://github.com/databk/rustdesk-console-web/issues/72)) ([665132f](https://github.com/databk/rustdesk-console-web/commit/665132f7ddb2e333cb2a80887a7ce6798f796e59))
* **theme:** add dark mode toggle button to header ([#52](https://github.com/databk/rustdesk-console-web/issues/52)) ([58310ee](https://github.com/databk/rustdesk-console-web/commit/58310eeea6ef6c89a05561acd7ac3c1b87f733aa))
* update brand assets and application name ([#49](https://github.com/databk/rustdesk-console-web/issues/49)) ([384437d](https://github.com/databk/rustdesk-console-web/commit/384437d75a06632b21461644df09700fa147dcd5))
* **users:** enhance user management with CRUD and role support ([6321844](https://github.com/databk/rustdesk-console-web/commit/632184486967c9e54fef143a217159fa028a9366))



