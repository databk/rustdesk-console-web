## [1.5.1](https://github.com/databk/rustdesk-console-web/compare/1.5.0...1.5.1) (2026-08-12)


### Bug Fixes

* **i18n:** add missing pt-BR translations and remove unused keys ([#270](https://github.com/databk/rustdesk-console-web/issues/270)) ([7c6249d](https://github.com/databk/rustdesk-console-web/commit/7c6249d1ea544fd92e5d8bcc818026e69215af3a))
* localize /user/center title via explicit route locale ([#265](https://github.com/databk/rustdesk-console-web/issues/265)) ([43b06ab](https://github.com/databk/rustdesk-console-web/commit/43b06ab9d8180f3ccef3dcf3ad324f9855716a09))
* prevent page title suffix from leaking into PageContainer ([#263](https://github.com/databk/rustdesk-console-web/issues/263)) ([d39b7f7](https://github.com/databk/rustdesk-console-web/commit/d39b7f78c2f9b020f5aa5388615411b09385daf6)), closes [#261](https://github.com/databk/rustdesk-console-web/issues/261)



# [1.5.0](https://github.com/databk/rustdesk-console-web/compare/1.4.0...1.5.0) (2026-08-07)


### Bug Fixes

* add target suffix to binary names to prevent overwrite on upload ([#233](https://github.com/databk/rustdesk-console-web/issues/233)) ([3503339](https://github.com/databk/rustdesk-console-web/commit/350333913d6c18a7e160b7722286371c92e09e83))
* **address-book:** remove unsupported recycle bin feature ([#241](https://github.com/databk/rustdesk-console-web/issues/241)) ([131fd32](https://github.com/databk/rustdesk-console-web/commit/131fd32c0cbd61a5db77c7e60a23ee6048191dc5))
* **build:** disable sourcemap in production build when using mako ([#252](https://github.com/databk/rustdesk-console-web/issues/252)) ([1d11da0](https://github.com/databk/rustdesk-console-web/commit/1d11da01ae277d65f3aebdeb48d6a34f8abc3e8a))
* change update check API from POST to GET with query params ([#237](https://github.com/databk/rustdesk-console-web/issues/237)) ([ae56de6](https://github.com/databk/rustdesk-console-web/commit/ae56de6d00128798bf463c62c37392c26442e9b1))
* **devices:** display version, cpu and memory in Info column instead of redundant OS info ([#242](https://github.com/databk/rustdesk-console-web/issues/242)) ([f3aa35f](https://github.com/databk/rustdesk-console-web/commit/f3aa35ff8205728dc2ad85e141c0ab4f70d76e3d))
* **devices:** reduce status column width and narrow ID column ([#243](https://github.com/databk/rustdesk-console-web/issues/243)) ([831f7f5](https://github.com/databk/rustdesk-console-web/commit/831f7f5db8aa0fb4a67990a85b29d6152ecacf77))
* dynamically adjust device action column width based on button count ([#248](https://github.com/databk/rustdesk-console-web/issues/248)) ([cd9b2c6](https://github.com/databk/rustdesk-console-web/commit/cd9b2c6a8474285f9048847cb774bd88ca4ff2e1))
* hardcode Docker Hub username as databk in workflow files ([#247](https://github.com/databk/rustdesk-console-web/issues/247)) ([5b8f90e](https://github.com/databk/rustdesk-console-web/commit/5b8f90e1c4e9562a605c1cc3e8161ad1a0da4bd3))
* prevent spurious 401 'Login expired' prompt on logout ([#253](https://github.com/databk/rustdesk-console-web/issues/253)) ([1edab6c](https://github.com/databk/rustdesk-console-web/commit/1edab6c13c5fc9042dff393e95cf8f0742ae9fc3))
* reduce connection audit table width to prevent horizontal scrollbar ([#246](https://github.com/databk/rustdesk-console-web/issues/246)) ([9efc2f9](https://github.com/databk/rustdesk-console-web/commit/9efc2f95decd896bd9140b73ee1c11c11e7d9084))
* **routes:** hoist /user/login to top-level route to restore layout:false ([#260](https://github.com/databk/rustdesk-console-web/issues/260)) ([e3cb940](https://github.com/databk/rustdesk-console-web/commit/e3cb940e47629b0f69b54db03bede8bca2ab1850))
* skip update-check on login page to avoid false 401 alert ([#213](https://github.com/databk/rustdesk-console-web/issues/213)) ([1509f77](https://github.com/databk/rustdesk-console-web/commit/1509f7712741adcac491d45cbdfce50164bd51a3))
* use macos-26-intel runner for x86_64-apple-darwin build ([#259](https://github.com/databk/rustdesk-console-web/issues/259)) ([876f199](https://github.com/databk/rustdesk-console-web/commit/876f1993d179eb103539e693f9c538e5567769b9))
* **user-groups:** remove unsupported note search from user group list ([#239](https://github.com/databk/rustdesk-console-web/issues/239)) ([f5f5e6c](https://github.com/databk/rustdesk-console-web/commit/f5f5e6ca366d4d20af6990aeef9f8af20c7fc4b9))
* **users:** remove horizontal scrollbar by making table columns responsive ([#236](https://github.com/databk/rustdesk-console-web/issues/236)) ([c6bbfab](https://github.com/databk/rustdesk-console-web/commit/c6bbfab1e0178e291803844c818f6154ebc4bf5a))


### Features

* add login session management ([#205](https://github.com/databk/rustdesk-console-web/issues/205)) ([4bc686f](https://github.com/databk/rustdesk-console-web/commit/4bc686ffec09d8d3de2b939c1cae0b4aa94b069c))
* add Passkey (WebAuthn) frontend integration ([#204](https://github.com/databk/rustdesk-console-web/issues/204)) ([0b4fa01](https://github.com/databk/rustdesk-console-web/commit/0b4fa015f69c6abeda099f88bc1f4e70c69049f9))
* add PWA support for installable web app ([#217](https://github.com/databk/rustdesk-console-web/issues/217)) ([c332aa7](https://github.com/databk/rustdesk-console-web/commit/c332aa711fa0bf3a77c883cf49e68939f88f5d7c))
* add standalone executable support with Rust embedded web server ([#198](https://github.com/databk/rustdesk-console-web/issues/198)) ([8773295](https://github.com/databk/rustdesk-console-web/commit/877329542cb88dd00e87626fd7b6789f36686e2e))
* **ci:** add nightly build workflow ([#215](https://github.com/databk/rustdesk-console-web/issues/215)) ([2c4233f](https://github.com/databk/rustdesk-console-web/commit/2c4233fcfe8ba8ac58c97a4de02e9a4db1445613))
* **config:** enable code splitting with granularChunks strategy ([#251](https://github.com/databk/rustdesk-console-web/issues/251)) ([4adbf1a](https://github.com/databk/rustdesk-console-web/commit/4adbf1aa7526ac1dead3bcd156ce98b6e6be7a2d))
* **custom-client:** add retry button for failed builds ([#235](https://github.com/databk/rustdesk-console-web/issues/235)) ([62e40ed](https://github.com/databk/rustdesk-console-web/commit/62e40ed72b05a6c75928cfba54dade2e45ed0fb9))
* **device-groups:** add name search functionality to device group list ([#240](https://github.com/databk/rustdesk-console-web/issues/240)) ([321cff0](https://github.com/databk/rustdesk-console-web/commit/321cff0d99c808ac591ed63df891607da32e8bf6))
* **devices:** make ID column clickable with rustdesk:// protocol link ([#244](https://github.com/databk/rustdesk-console-web/issues/244)) ([32d4b3b](https://github.com/databk/rustdesk-console-web/commit/32d4b3bf831289d9ca5371fa524baa14ceec6d62))
* **groups:** make user group name clickable to open group user list ([#218](https://github.com/databk/rustdesk-console-web/issues/218)) ([1a97fe3](https://github.com/databk/rustdesk-console-web/commit/1a97fe303073393aa90f18ce2606cf1bb5ff76e5))
* **server:** update default listen port to 21114 and backend URL port to 3000 ([#229](https://github.com/databk/rustdesk-console-web/issues/229)) ([301c14d](https://github.com/databk/rustdesk-console-web/commit/301c14dfbfe18d2103fbd2bfa7aec1c97a68cd1f))
* set random default color for new tags ([#245](https://github.com/databk/rustdesk-console-web/issues/245)) ([838c9e0](https://github.com/databk/rustdesk-console-web/commit/838c9e0afe2f40778062462293fa2cd3a0b8f2ce))
* **settings:** support expanded general settings contract ([#249](https://github.com/databk/rustdesk-console-web/issues/249)) ([53bdc5a](https://github.com/databk/rustdesk-console-web/commit/53bdc5aa7e323bed35218606c6f55e8380c67414))
* **settings:** use public /settings/frontend for bootstrap config ([#250](https://github.com/databk/rustdesk-console-web/issues/250)) ([b3dd7b2](https://github.com/databk/rustdesk-console-web/commit/b3dd7b20adb6c81f6062c0b4dd9224984c859670))
* **users:** add user_group_name, strategy_name and is_admin query params ([#238](https://github.com/databk/rustdesk-console-web/issues/238)) ([3f6380c](https://github.com/databk/rustdesk-console-web/commit/3f6380c619a600c25b3fdd73f68b70af122e88ed))



# [1.4.0](https://github.com/databk/rustdesk-console-web/compare/1.3.0...1.4.0) (2026-07-22)


### Features

* add columns state persistence to all ProTable instances ([#190](https://github.com/databk/rustdesk-console-web/issues/190)) ([8013358](https://github.com/databk/rustdesk-console-web/commit/8013358a0859e43812f6120ea56310aee737a549))
* add console general settings and configurable watermark ([#197](https://github.com/databk/rustdesk-console-web/issues/197)) ([56839cb](https://github.com/databk/rustdesk-console-web/commit/56839cb06e07b270b9dbe9edcfbfaa2aeebd1b50))
* add display_name field support for users ([#195](https://github.com/databk/rustdesk-console-web/issues/195)) ([440d319](https://github.com/databk/rustdesk-console-web/commit/440d31971f1274f493034ba295a3be6b1d7a54e2))
* add linux/arm64 Docker image build support ([#196](https://github.com/databk/rustdesk-console-web/issues/196)) ([16671bc](https://github.com/databk/rustdesk-console-web/commit/16671bc873ba09f9560c082fa40ac26c6ee0dc07))
* add user_group_guid field to user update ([#203](https://github.com/databk/rustdesk-console-web/issues/203)) ([0515620](https://github.com/databk/rustdesk-console-web/commit/05156206d9f9738e39bc59767f804e2499d72ae3))
* complete user-group management workflows ([#188](https://github.com/databk/rustdesk-console-web/issues/188)) ([7443ce1](https://github.com/databk/rustdesk-console-web/commit/7443ce1e875a179a38f30cd365ee93d67bc498eb))
* extend address book sharing to support individual users and everyone ([#200](https://github.com/databk/rustdesk-console-web/issues/200)) ([13a059e](https://github.com/databk/rustdesk-console-web/commit/13a059e5118d35cb1922a13e37929af0a9c44379))
* implement drag sort for OIDC providers ([#199](https://github.com/databk/rustdesk-console-web/issues/199)) ([3604d41](https://github.com/databk/rustdesk-console-web/commit/3604d41b711e0a419e19dc0f00a83c05333e9aec))
* manage custom address books from the personal page ([#189](https://github.com/databk/rustdesk-console-web/issues/189)) ([901a24c](https://github.com/databk/rustdesk-console-web/commit/901a24c7f724024b5251619136966599b7cb7918))


### Reverts

* remove site name functionality from commit 56839cb ([#202](https://github.com/databk/rustdesk-console-web/issues/202)) ([8fc55cc](https://github.com/databk/rustdesk-console-web/commit/8fc55cc8af04be0650a2e3ef1e66722f836fe796))



# [1.3.0](https://github.com/databk/rustdesk-console-web/compare/1.2.2...1.3.0) (2026-07-15)


### Features

* add custom client generation via Nexus API ([#180](https://github.com/databk/rustdesk-console-web/issues/180)) ([2c5b2a5](https://github.com/databk/rustdesk-console-web/commit/2c5b2a5c7dd16e6ee0d38d35e3d75d782d47c5b4))
* add Portuguese (Brazil) localization support ([#175](https://github.com/databk/rustdesk-console-web/issues/175)) ([811a9fe](https://github.com/databk/rustdesk-console-web/commit/811a9fed8d157d4a96100002206935a89284da2e))
* add update check support for POST /api/update-check ([#169](https://github.com/databk/rustdesk-console-web/issues/169)) ([04a6527](https://github.com/databk/rustdesk-console-web/commit/04a652757144b0e87d715b5199ecdee29075039e))
* make SMTP user and pass fields optional to support non-auth servers ([#181](https://github.com/databk/rustdesk-console-web/issues/181)) ([bc47f52](https://github.com/databk/rustdesk-console-web/commit/bc47f527204e3cd05206b7c1502168b9d8e6ea7a))



## [1.2.2](https://github.com/databk/rustdesk-console-web/compare/1.2.1...1.2.2) (2026-06-20)


### Bug Fixes

* resolve invisible 2FA verification inputs and buttons on login page ([#162](https://github.com/databk/rustdesk-console-web/issues/162)) ([f814549](https://github.com/databk/rustdesk-console-web/commit/f814549906dd86626e26795419554c345c81c903))
* use tfa_type field to determine 2FA verification type on login ([#163](https://github.com/databk/rustdesk-console-web/issues/163)) ([3ac025d](https://github.com/databk/rustdesk-console-web/commit/3ac025df0d7f2ced30991a76ad08b7707c1815df))


### Reverts

* Revert "chore(deps-dev): bump @biomejs/biome from 2.4.16 to 2.5.0 (#159)" (#161) ([208fe7f](https://github.com/databk/rustdesk-console-web/commit/208fe7fbf5789a244909dcd1c4df68c33dd35887)), closes [#159](https://github.com/databk/rustdesk-console-web/issues/159) [#161](https://github.com/databk/rustdesk-console-web/issues/161)



