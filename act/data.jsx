// ============================================================
// ANIMAL WORLD ZOO — game data (single source of truth)
// A slow, sustainable idle zoo-builder. Numbers tuned for
// deliberate, months-long progression.
// ============================================================

// ---- i18n + player settings (loaded first so every later module has t()) ----
// t(key, vars?) → localized string; falls back to English, then the raw key.
// Strings may contain {placeholders} replaced from vars. Only high-visibility
// UI is translated for now (tabs, HUD, settings, tutorial, key modals/buttons);
// untranslated strings fall back to English gracefully.
const I18N = {
  en: {
    'tab.zoo':'Zoo', 'tab.animals':'Animals', 'tab.attract':'Attract', 'tab.activities':'Activities', 'tab.shop':'Shop',
    'cur.gold':'Gold', 'cur.gems':'Gems', 'cur.zoo':'Zoo',
    'xp.next':'Lv {lv} · {n} XP → Lv {next}', 'xp.max':'Lv {lv} · MAX',
    'set.title':'Settings', 'set.sound':'Sound', 'set.volume':'Volume', 'set.language':'Language',
    'set.english':'English', 'set.vietnamese':'Tiếng Việt', 'set.on':'On', 'set.off':'Off', 'set.done':'Done',
    'start.title':'Welcome to your zoo!', 'start.body':'Adopt animals, care for them and let visitors stream in. Your zoo earns gold automatically — ready to open the gates?', 'start.cta':'Let’s go ▶',
    'off.title':'While you were away', 'off.away':'Your zoo welcomed visitors for {t}', 'off.cap':' (idle cap reached)',
    'off.gold':'Gold', 'off.rate':'Rate', 'off.rateval':'~60% of {r}/s', 'off.collect':'Collect rewards', 'off.collected':'Collected! 🪙 +{n}',
    'care.feed':'Feed', 'care.water':'Water', 'care.bathe':'Bathe', 'care.play':'Play', 'care.health':'Health', 'care.free':'free',
    'care.needs':'Needs', 'care.foodnote':'🛒 Food price scales with species · needs refill on a cooldown', 'care.back':'‹ Animals',
    'tut.skip':'Skip tutorial', 'tut.guide':'Guide · {n} of {m}', 'tut.reward':'🎁 Reward · {r}',
    'tut.skipTitle':'Skip the guided tips?', 'tut.skipBody':'You can replay them anytime from the ❔ button at the top. Skip for now?',
    'tut.skipNo':'No, keep it', 'tut.skipYes':'Yes, skip',
    'tut.play.title':'Say hello to Clover', 'tut.play.body':'Tap 🎾 Play — it’s free, and it makes Clover happier. Happy, well-cared animals attract more visitors.', 'tut.play.do':'Tap 🎾 Play',
    'tut.watch.title':'Your zoo earns on its own', 'tut.watch.body':'See the 🪙 counter rising at the top? Visitors pay as they arrive — even while you’re away. No need to tap nonstop; just let it run a while.', 'tut.watch.cta':'Got it',
    'tut.feed.title':'Clover is getting hungry', 'tut.feed.body':'You’ve earned enough now — tap 🍖 Feed to fill her hunger. Feeding, watering and cleaning all keep her welfare (and your income) up.', 'tut.feed.do':'Tap 🍖 Feed',
    'tut.buy.title':'Adopt your second animal', 'tut.buy.body':'You’ve saved enough for a new species! Open 🐾 Animals, scroll down to an unlocked animal and tap Buy to adopt it.', 'tut.buy.do':'Open 🐾 Animals · tap Buy',
    'tut.upgrade.title':'Make room for more', 'tut.upgrade.body':'An enclosure can hold more animals as you upgrade it. When you can afford it, open one and tap Upgrade for +1 slot and more appeal.', 'tut.upgrade.do':'Open an enclosure · Upgrade',
    'tut.levelup.title':'Your zoo is levelling up', 'tut.levelup.body':'Care actions and quests earn Zoo XP. A higher Zoo Level steadily unlocks new animals, habitats and attractions — your long-term goal.', 'tut.levelup.cta':'Nice!',
    'tut.attraction.title':'Build your first attraction', 'tut.attraction.body':'At Lv7 the Petting Area unlocks — it draws more visitors and opens activities. Open 🎡 Attract and build it whenever you’re ready.', 'tut.attraction.do':'Open 🎡 Attract · Build',
    'tut.graduate.title':'You’ve got this!', 'tut.graduate.body':'You’ve learned the loop: care → visitors → gold → upgrade & unlock. Pop in for a few minutes a day and your zoo keeps growing. Have fun!', 'tut.graduate.cta':'Finish',
  },
  vi: {
    'tab.zoo':'Sở thú', 'tab.animals':'Thú', 'tab.attract':'Tiện ích', 'tab.activities':'Hoạt động', 'tab.shop':'Cửa hàng',
    'cur.gold':'Vàng', 'cur.gems':'Ngọc', 'cur.zoo':'Sở thú',
    'xp.next':'Lv {lv} · {n} XP → Lv {next}', 'xp.max':'Lv {lv} · TỐI ĐA',
    'set.title':'Cài đặt', 'set.sound':'Âm thanh', 'set.volume':'Âm lượng', 'set.language':'Ngôn ngữ',
    'set.english':'English', 'set.vietnamese':'Tiếng Việt', 'set.on':'Bật', 'set.off':'Tắt', 'set.done':'Xong',
    'start.title':'Chào mừng đến sở thú!', 'start.body':'Nhận nuôi thú, chăm sóc chúng và đón khách tham quan. Sở thú tự kiếm vàng — sẵn sàng mở cổng chưa?', 'start.cta':'Bắt đầu ▶',
    'off.title':'Khi bạn vắng mặt', 'off.away':'Sở thú đã đón khách trong {t}', 'off.cap':' (đã đạt giới hạn nghỉ)',
    'off.gold':'Vàng', 'off.rate':'Tốc độ', 'off.rateval':'~60% của {r}/giây', 'off.collect':'Nhận thưởng', 'off.collected':'Đã nhận! 🪙 +{n}',
    'care.feed':'Cho ăn', 'care.water':'Cho uống', 'care.bathe':'Tắm', 'care.play':'Chơi', 'care.health':'Khám', 'care.free':'miễn phí',
    'care.needs':'Nhu cầu', 'care.foodnote':'🛒 Giá thức ăn tăng theo loài · cần nạp lại sau thời gian chờ', 'care.back':'‹ Thú',
    'tut.skip':'Bỏ qua hướng dẫn', 'tut.guide':'Hướng dẫn · {n}/{m}', 'tut.reward':'🎁 Thưởng · {r}',
    'tut.skipTitle':'Bỏ qua hướng dẫn?', 'tut.skipBody':'Bạn có thể xem lại bất cứ lúc nào qua nút ❔ ở trên. Bỏ qua bây giờ?',
    'tut.skipNo':'Không, giữ lại', 'tut.skipYes':'Có, bỏ qua',
    'tut.play.title':'Chào Clover nào', 'tut.play.body':'Chạm 🎾 Chơi — miễn phí và làm Clover vui hơn. Thú vui vẻ, được chăm tốt sẽ thu hút nhiều khách hơn.', 'tut.play.do':'Chạm 🎾 Chơi',
    'tut.watch.title':'Sở thú tự kiếm tiền', 'tut.watch.body':'Thấy số 🪙 ở trên đang tăng chứ? Khách trả tiền khi vào — kể cả khi bạn rời đi. Không cần bấm liên tục; cứ để nó chạy một lúc.', 'tut.watch.cta':'Hiểu rồi',
    'tut.feed.title':'Clover hơi đói rồi', 'tut.feed.body':'Bạn đã kiếm đủ vàng — chạm 🍖 Cho ăn để làm no bụng. Cho ăn, cho uống và tắm đều giữ sức khoẻ bé (và thu nhập của bạn).', 'tut.feed.do':'Chạm 🍖 Cho ăn',
    'tut.buy.title':'Nhận nuôi loài thứ hai', 'tut.buy.body':'Bạn đã dành đủ vàng cho một loài mới! Mở 🐾 Thú, kéo xuống một loài đã mở khoá và chạm Mua để nhận nuôi.', 'tut.buy.do':'Mở 🐾 Thú · chạm Mua',
    'tut.upgrade.title':'Mở rộng chỗ ở', 'tut.upgrade.body':'Chuồng chứa được nhiều thú hơn khi nâng cấp. Khi đủ vàng, mở một chuồng và chạm Nâng cấp để +1 chỗ và tăng sức hút.', 'tut.upgrade.do':'Mở chuồng · Nâng cấp',
    'tut.levelup.title':'Sở thú đang lên cấp', 'tut.levelup.body':'Chăm sóc và nhiệm vụ mang lại XP. Cấp Sở thú càng cao càng mở khoá thú, biome và tiện ích mới — mục tiêu dài hạn của bạn.', 'tut.levelup.cta':'Tuyệt!',
    'tut.attraction.title':'Xây tiện ích đầu tiên', 'tut.attraction.body':'Đạt Lv7 sẽ mở Khu vuốt ve — kéo thêm khách và mở hoạt động. Mở 🎡 Tiện ích và xây khi bạn sẵn sàng.', 'tut.attraction.do':'Mở 🎡 Tiện ích · Xây',
    'tut.graduate.title':'Bạn đã nắm rồi!', 'tut.graduate.body':'Bạn đã hiểu vòng lặp: chăm sóc → khách → vàng → nâng cấp & mở khoá. Ghé thăm vài phút mỗi ngày và sở thú sẽ lớn dần. Chúc vui!', 'tut.graduate.cta':'Hoàn thành',
  },
};
// ---- merged screen translations (localization pass) — kept in {en,vi} form then split ----
const _EXT = {
  // ── proto-screens.jsx ──────────────────────────────────────
  'scr.anim.greet':{en:'Good morning, Director!',vi:'Chào buổi sáng, Giám đốc!'},
  'scr.anim.intro':{en:'Tap an animal to care for it, or adopt new species below as your zoo levels up.',vi:'Chạm vào thú để chăm sóc, hoặc nhận nuôi loài mới bên dưới khi sở thú lên cấp.'},
  'scr.anim.owned_hd':{en:'Your animals',vi:'Thú của bạn'},
  'scr.anim.owned_sub':{en:'{n} species · Zoo Level {lv}',vi:'{n} loài · Cấp Sở thú {lv}'},
  'scr.anim.map_link':{en:'Map ›',vi:'Bản đồ ›'},
  'scr.anim.appeal':{en:'appeal',vi:'sức hút'},
  'scr.anim.adopt_hd':{en:'Adopt new animals',vi:'Nhận nuôi thú mới'},
  'scr.anim.adopt_sub':{en:'unlocked as your Zoo Level rises',vi:'mở khoá khi cấp Sở thú tăng lên'},
  'scr.anim.needs_lv':{en:'needs Lv{lv}',vi:'cần Lv{lv}'},
  'scr.anim.reach_lv':{en:'Reach Lv {lv}',vi:'Đạt Lv {lv}'},
  'scr.anim.buy_btn':{en:'Buy · {gold}',vi:'Mua · {gold}'},
  'scr.care.stat_hunger':{en:'Hunger',vi:'Cơn đói'},
  'scr.care.stat_thirst':{en:'Thirst',vi:'Cơn khát'},
  'scr.care.stat_clean':{en:'Cleanliness',vi:'Vệ sinh'},
  'scr.care.stat_happy':{en:'Happiness',vi:'Hạnh phúc'},
  'scr.care.stat_trust':{en:'Trust',vi:'Tin tưởng'},
  'scr.care.adult':{en:'Adult',vi:'Trưởng thành'},
  'scr.care.appeal_lbl':{en:'appeal',vi:'sức hút'},
  'scr.care.taming_chip':{en:'Taming · {taming}',vi:'Thuần hóa · {taming}'},
  'scr.care.can_perform':{en:'Can perform',vi:'Có thể biểu diễn'},
  'scr.attr.hd':{en:'Attractions',vi:'Tiện ích'},
  'scr.attr.sub':{en:'Your animals draw the crowds',vi:'Thú của bạn thu hút du khách'},
  'scr.attr.built':{en:'Built',vi:'Đã xây'},
  'scr.attr.build_btn':{en:'Build · {cost}',vi:'Xây · {cost}'},
  'scr.attr.reach_lv':{en:'Reach Lv {n}',vi:'Đạt Lv {n}'},
  'scr.attr.stars_hd':{en:'Your animals here',vi:'Thú của bạn ở đây'},
  'scr.attr.no_stars':{en:'No eligible animals yet — unlock one to feature it here.',vi:'Chưa có thú đủ điều kiện — mở khoá một loài để đưa vào đây.'},
  'scr.acts.greet':{en:'Visitor activities',vi:'Hoạt động du khách'},
  'scr.acts.intro':{en:'Build an attraction to open its activities. Each runs for gold, reputation & XP, then needs a cooldown.',vi:'Xây tiện ích để mở các hoạt động. Mỗi hoạt động mang lại vàng, danh tiếng & XP, rồi cần thời gian hồi.'},
  'scr.acts.cd_label':{en:'CD {cd}',vi:'Hồi {cd}'},
  'scr.acts.build_attr':{en:'Build {name}',vi:'Xây {name}'},
  'scr.acts.reach_lv':{en:'Reach Lv {n}',vi:'Đạt Lv {n}'},
  'scr.acts.live':{en:'live',vi:'trực tiếp'},
  'scr.acts.requires':{en:'Requires {species}',vi:'Cần có {species}'},
  'scr.acts.locked':{en:'Locked',vi:'Bị khóa'},
  'scr.acts.unlock_req':{en:'Unlock {species}',vi:'Mở khoá {species}'},
  'scr.acts.run_btn':{en:'Run',vi:'Chạy'},
  'scr.shop.hd':{en:'Shop',vi:'Cửa hàng'},
  'scr.shop.sub':{en:'Convenience & cosmetics — never animals',vi:'Tiện ích & trang trí — không bao giờ bán thú'},
  'scr.shop.gold_hd':{en:'Buy gold with gems',vi:'Mua vàng bằng ngọc'},
  'scr.shop.vip_name':{en:'VIP Membership',vi:'Thành viên VIP'},
  'scr.shop.vip_desc':{en:'24h idle · 2× daily gems · no ads',vi:'Nghỉ 24h · 2× ngọc hằng ngày · không quảng cáo'},
  'scr.shop.gems_hd':{en:'Gem packs',vi:'Gói ngọc'},
  'scr.shop.offers_hd':{en:'Offers',vi:'Ưu đãi'},
  'scr.shop.best_value':{en:'BEST VALUE',vi:'GIÁ TRỊ NHẤT'},
  'scr.enc.back':{en:'‹ Back',vi:'‹ Quay lại'},
  'scr.enc.enclosure_type':{en:'{habitat} enclosure',vi:'Chuồng {habitat}'},
  'scr.enc.animal_count':{en:'{n} animals · ✨{appeal} appeal total',vi:'{n} con · ✨{appeal} sức hút tổng cộng'},
  'scr.enc.enc_lv':{en:'Enclosure · Lv {lv}',vi:'Chuồng · Lv {lv}'},
  'scr.enc.slots':{en:'{count}/{cap} animals · ✨{appeal} appeal',vi:'{count}/{cap} con · ✨{appeal} sức hút'},
  'scr.enc.buy_btn':{en:'Buy {name}',vi:'Mua {name}'},
  'scr.enc.upgrade_btn':{en:'Upgrade',vi:'Nâng cấp'},
  'scr.enc.max_lv':{en:'Max Lv {n}',vi:'Lv tối đa {n}'},
  'scr.enc.enrich_btn':{en:'Enrichment · {toy}',vi:'Làm phong phú · {toy}'},
  'scr.enc.enrich_effect':{en:'+happiness & appeal',vi:'+hạnh phúc & sức hút'},
  'scr.enc.enrich_maxed':{en:'Enrichment maxed (Lv {n})',vi:'Làm phong phú tối đa (Lv {n})'},
  'scr.enc.enc_full':{en:'Enclosure full — upgrade for +1 slot & more appeal',vi:'Chuồng đầy — nâng cấp để thêm 1 chỗ & tăng sức hút'},
  'scr.enc.animals_hd':{en:'Animals in this enclosure',vi:'Thú trong chuồng này'},
  'scr.enc.status_hungry':{en:'Hungry',vi:'Đói bụng'},
  'scr.enc.status_thirsty':{en:'Thirsty',vi:'Khát nước'},
  'scr.enc.status_cleaning':{en:'Needs cleaning',vi:'Cần tắm rửa'},
  'scr.enc.status_restless':{en:'Restless',vi:'Bồn chồn'},
  'scr.enc.status_thriving':{en:'Thriving',vi:'Phát triển tốt'},
  'scr.enc.status_content':{en:'Content',vi:'Thoải mái'},
  'scr.enc.toy.tunnel':{en:'Tunnel maze',vi:'Mê cung ống'},
  'scr.enc.toy.peck':{en:'Peck garden',vi:'Vườn mổ hạt'},
  'scr.enc.toy.splash':{en:'Splash pond',vi:'Ao vui nước'},
  'scr.enc.toy.agility':{en:'Agility hoops',vi:'Vòng chạy nhanh'},
  'scr.enc.toy.climb':{en:'Climbing tree',vi:'Cây leo trèo'},
  'scr.enc.toy.balance':{en:'Balance bridge',vi:'Cầu thăng bằng'},
  'scr.enc.toy.paddock':{en:'Open paddock',vi:'Bãi chạy tự do'},
  'scr.enc.toy.scent':{en:'Scent boxes',vi:'Hộp mùi hương'},
  'scr.enc.toy.floating':{en:'Floating toys',vi:'Đồ chơi nổi nước'},
  'scr.enc.toy.ball':{en:'Ball play',vi:'Chơi bóng'},
  'scr.enc.toy.rope':{en:'Rope course',vi:'Đường dây leo'},
  'scr.enc.toy.playset':{en:'Play set',vi:'Bộ đồ chơi'},
  // ── quest-admin.jsx ────────────────────────────────────────
  'quest.fab_title':{en:'Quests',vi:'Nhiệm vụ'},
  'quest.close':{en:'Close',vi:'Đóng'},
  'quest.all_done':{en:'All quests complete!',vi:'Hoàn thành tất cả nhiệm vụ!'},
  'quest.ch_chip':{en:'CH {ch}',vi:'CH {ch}'},
  'quest.claim':{en:'Claim',vi:'Nhận thưởng'},
  'quest.go':{en:'Go',vi:'Đến'},
  'quest.ch.1.title':{en:'Welcome to the Zoo',vi:'Chào mừng đến Sở thú'},
  'quest.ch.2.title':{en:'Growing the Zoo',vi:'Mở rộng Sở thú'},
  'quest.ch.3.title':{en:'First Expansion',vi:'Lần mở rộng đầu tiên'},
  'quest.ch.4.title':{en:'Happy Visitors',vi:'Khách tham quan vui vẻ'},
  'quest.ch.5.title':{en:'New Attractions',vi:'Tiện ích mới'},
  'quest.ch.6.title':{en:'Building a Real Zoo',vi:'Xây dựng Sở thú thật sự'},
  'quest.ch.7.title':{en:'Future Zoo Manager',vi:'Quản lý Sở thú tương lai'},
  'quest.obj.feed':{en:'Feed {n} animal(s)',vi:'Cho {n} con vật ăn'},
  'quest.obj.clean':{en:'Clean {n} habitat(s)',vi:'Dọn {n} chuồng'},
  'quest.obj.owned':{en:'Own {n} animals',vi:'Sở hữu {n} con vật'},
  'quest.obj.level':{en:'Reach Zoo Level {n}',vi:'Đạt Cấp Sở thú {n}'},
  'quest.obj.photo':{en:'Complete {n} Photo activities',vi:'Hoàn thành {n} hoạt động Chụp ảnh'},
  'quest.obj.feeding':{en:'Complete {n} Feeding activities',vi:'Hoàn thành {n} hoạt động Cho ăn'},
  'quest.obj.ride':{en:'Run {n} Animal Ride(s)',vi:'Tổ chức {n} buổi cưỡi thú'},
  'quest.obj.activity':{en:'Complete {n} activities',vi:'Hoàn thành {n} hoạt động'},
  'quest.obj.vip':{en:'Serve {n} VIP guest(s)',vi:'Phục vụ {n} khách VIP'},
  'svc.fab_title':{en:'VIP services',vi:'Dịch vụ VIP'},
  'svc.title.1':{en:'Serve a VIP guest',vi:'Phục vụ khách VIP'},
  'svc.title.2':{en:'VIP Host',vi:'Đón tiếp VIP'},
  'svc.title.3':{en:'Five-Star Service',vi:'Dịch vụ 5 sao'},
  'svc.title.4':{en:'VIP Concierge',vi:'Lễ tân VIP'},
  'svc.title.concierge':{en:'VIP Concierge',vi:'Lễ tân VIP'},
  'admin.title':{en:'Admin tools',vi:'Công cụ quản trị'},
  'admin.zoo_level':{en:'Zoo Level',vi:'Cấp Sở thú'},
  'admin.lv':{en:'Lv {lv}',vi:'Lv {lv}'},
  'admin.gold_add':{en:'+{n}',vi:'+{n}'},
  'admin.gems_add':{en:'+{n}',vi:'+{n}'},
  'admin.level_add':{en:'Level +{n}',vi:'Cấp +{n}'},
  'admin.unlock_next':{en:'Unlock next',vi:'Mở khoá tiếp theo'},
  'admin.unlock_all':{en:'Unlock all',vi:'Mở khoá tất cả'},
  'admin.reset':{en:'↺ Reset game',vi:'↺ Đặt lại trò chơi'},
  'admin.dev_note':{en:'For testing — jump levels & top up to pass any stage.',vi:'Dùng để kiểm thử — nhảy cấp và nạp tiền để vượt bất kỳ giai đoạn nào.'},
  // ── live-scene.jsx ─────────────────────────────────────────
  'live.appeal_tip':{en:'Zoo appeal → draws visitors',vi:'Sức hút sở thú → thu hút khách'},
  'live.visitors_capped':{en:'Visitors capped — add animals/attractions for more capacity',vi:'Đã đạt giới hạn khách — thêm thú hoặc tiện ích để tăng sức chứa'},
  'live.visitors_tip':{en:'Visitors / capacity',vi:'Khách / sức chứa'},
  'live.zoom_out':{en:'Zoom out',vi:'Thu nhỏ'},
  'live.zoom_in':{en:'Zoom in',vi:'Phóng to'},
  'live.map_title':{en:'Park map',vi:'Bản đồ công viên'},
  'live.plot_label':{en:'{species} ×{n}',vi:'{species} ×{n}'},
  'live.locked_tip':{en:'Locked — tap to view the collection',vi:'Chưa mở — chạm để xem bộ sưu tập'},
  'live.locked_label':{en:'Locked',vi:'Chưa mở'},
  'live.gate_welcome':{en:'Welcome',vi:'Chào mừng'},
  'live.vip_tag':{en:'VIP! tap to serve',vi:'VIP! chạm để phục vụ'},
  'live.drag_hint':{en:'✋ Drag to pan · 🪙 tap coins for bonus gold',vi:'✋ Kéo để di chuyển · 🪙 chạm đồng tiền để nhận vàng thưởng'},
  'live.vip_banner':{en:'🤵 A VIP guest arrived! Tap them on the map to serve — big reward 🎁',vi:'🤵 Khách VIP vừa đến! Chạm vào họ trên bản đồ để phục vụ — phần thưởng lớn đây 🎁'},
  // ── show-stage.jsx ─────────────────────────────────────────
  'show.title':{en:'Showtime',vi:'Biểu diễn'},
  'show.skip':{en:'Skip',vi:'Bỏ qua'},
  'show.combo':{en:'COMBO ×{n}',vi:'COMBO ×{n}'},
  'show.crowd_label':{en:'Crowd',vi:'Khán giả'},
  'show.trick.ball_balancing':{en:'Ball balancing!',vi:'Cân bóng!'},
  'show.trick.dancing':{en:'Dancing!',vi:'Nhảy múa!'},
  'show.trick.jumping':{en:'Jumping!',vi:'Nhảy cao!'},
  'show.trick.fetching':{en:'Fetching!',vi:'Đón bắt!'},
  'show.trick.team_routine':{en:'Team routine!',vi:'Màn đôi!'},
  'show.finale_title':{en:'Grand finale!',vi:'Màn kết hoành tráng!'},
  'show.finale_stats':{en:'Avg trust {avg}% · combo ×{combo}',vi:'Tin tưởng TB {avg}% · combo ×{combo}'},
  // ── activity-stage.jsx ─────────────────────────────────────
  'actv.cat.photo':{en:'Photo session',vi:'Chụp ảnh lưu niệm'},
  'actv.cat.feeding':{en:'Feeding time',vi:'Giờ cho ăn'},
  'actv.cat.riding':{en:'Animal ride',vi:'Cưỡi thú'},
  'actv.cat.edu':{en:'Educational show',vi:'Biểu diễn giáo dục'},
  'actv.cat.premium':{en:'Premium encounter',vi:'Trải nghiệm đặc biệt'},
  'actv.cap.photo':{en:'Say cheese!',vi:'Cười lên nào!'},
  'actv.cap.feeding':{en:'Yum!',vi:'Ngon quá!'},
  'actv.cap.riding':{en:'Giddy up!',vi:'Phi nhanh thôi!'},
  'actv.cap.edu':{en:'Amazing!',vi:'Tuyệt vời!'},
  'actv.cap.premium':{en:'Unforgettable!',vi:'Không thể quên!'},
  'actv.skip':{en:'Skip',vi:'Bỏ qua'},
  'actv.reward.gold':{en:'Gold',vi:'Vàng'},
  'actv.reward.rep':{en:'Reputation',vi:'Danh tiếng'},
  'actv.reward.xp':{en:'Zoo XP',vi:'XP Sở thú'},
  'actv.reward.happy':{en:'Satisfaction',vi:'Hài lòng'},
  'actv.complete':{en:'{name} complete!',vi:'{name} hoàn thành!'},
  'actv.collect':{en:'Collect',vi:'Nhận thưởng'},
  // ── prototype.jsx: SIDE help text ──────────────────────────
  'scr.side.live.t':{en:'Live zoo (idle home)',vi:'Sở thú trực tiếp (màn chính idle)'},
  'scr.side.live.d':{en:'The home screen is a living zoo. Visitors stream in through the ticket gate and stroll the paths past your habitats — and gold ticks up in real time even while you watch. This is the idle session: the zoo earns whether you play 90 seconds or 20 minutes. Use the speed toggle to fast-forward.',vi:'Màn hình chính là một sở thú sống động. Khách vào qua cổng vé và dạo quanh các chuồng — vàng tăng theo thời gian thực ngay cả khi bạn đứng xem. Đây là phiên idle: sở thú vẫn kiếm tiền dù bạn chơi 90 giây hay 20 phút. Dùng nút tốc độ để tua nhanh.'},
  'scr.side.animals.t':{en:'Animals / collection',vi:'Thú / bộ sưu tập'},
  'scr.side.animals.d':{en:'Every owned species with its live needs. Amber ring = a need is low. Tap to open care. Animals are organised by habitat (Meadow, Pasture, …) and unlocked one at a time as the zoo levels up — never bought with money.',vi:'Mọi loài bạn sở hữu cùng nhu cầu của chúng. Viền hổ phách = một nhu cầu đang thấp. Chạm để mở chăm sóc. Thú được xếp theo môi trường (Đồng cỏ, Bãi chăn, …) và mở khoá lần lượt khi sở thú lên cấp — không bao giờ mua bằng tiền.'},
  'scr.side.care.t':{en:'Animal care',vi:'Chăm sóc thú'},
  'scr.side.care.d':{en:'Six one-tap actions move the five needs. Hunger & Thirst drain on a timer; Cleanliness is habitat hygiene; Happiness is the visible outcome; Trust builds slowly through daily care and gates attractions & performance. Better care = more visitor satisfaction & income.',vi:'Các thao tác một chạm điều chỉnh năm nhu cầu. Đói & Khát giảm theo thời gian; Vệ sinh là độ sạch của chuồng; Hạnh phúc là kết quả thấy được; Tin tưởng tăng dần qua chăm sóc hằng ngày và mở khoá tiện ích & biểu diễn. Chăm tốt hơn = khách hài lòng hơn & thu nhập cao hơn.'},
  'scr.side.enclosure.t':{en:'Enclosure detail',vi:'Chi tiết chuồng'},
  'scr.side.enclosure.d':{en:'Tapping an enclosure opens the animals living inside it. Each individual shows its own status — Hungry, Thirsty, Needs cleaning, Restless, Content or Thriving — so you can spot which one needs attention. Tap an animal to care for it.',vi:'Chạm vào một chuồng để xem các con vật bên trong. Mỗi con hiển thị trạng thái riêng — Đói, Khát, Cần tắm, Bồn chồn, Thoải mái hay Phát triển tốt — để bạn biết con nào cần chú ý. Chạm vào một con để chăm sóc.'},
  'scr.side.attractions.t':{en:'Attractions',vi:'Tiện ích'},
  'scr.side.attractions.d':{en:'Built gradually as the zoo expands. Petting, Feeding Zone, Rides, Educational Shows and the Performance Arena each multiply visitors, revenue or reputation. Big milestone purchases that reshape income.',vi:'Được xây dần khi sở thú mở rộng. Khu vuốt ve, Khu cho ăn, Cưỡi thú, Biểu diễn giáo dục và Đấu trường biểu diễn đều nhân số khách, doanh thu hoặc danh tiếng. Những khoản mua cột mốc lớn làm thay đổi thu nhập.'},
  'scr.side.show.t':{en:'Entertainment activities',vi:'Hoạt động giải trí'},
  'scr.side.show.d':{en:'Visitor experiences — photo sessions, feeding, rides, educational demos and premium encounters. Each activity requires specific animal species and has a cooldown, so unlocking a new animal opens entirely new activities and revenue. Players strategically run activities through the day for gold, reputation, satisfaction and XP.',vi:'Trải nghiệm cho khách — chụp ảnh, cho ăn, cưỡi thú, trình diễn giáo dục và trải nghiệm cao cấp. Mỗi hoạt động cần loài thú cụ thể và có thời gian hồi, nên mở khoá loài mới sẽ mở ra hoạt động và doanh thu mới. Người chơi sắp xếp chạy hoạt động trong ngày để nhận vàng, danh tiếng, sự hài lòng và XP.'},
  'scr.side.shop.t':{en:'Shop',vi:'Cửa hàng'},
  'scr.side.shop.d':{en:'Cosmetic-led monetization: gem packs, VIP membership, decor & habitat themes, event pass. Convenience and cosmetics only — progression and animals are never sold.',vi:'Kiếm tiền chủ yếu từ trang trí: gói ngọc, thành viên VIP, vật trang trí & giao diện chuồng, vé sự kiện. Chỉ tiện lợi & trang trí — không bao giờ bán tiến trình hay thú.'},
  // ── prototype.jsx: modals + misc ───────────────────────────
  'modal.rename.title':{en:'Name your {species}',vi:'Đặt tên cho {species}'},
  'modal.adopt.title':{en:'Adopt a {species}',vi:'Nhận nuôi {species}'},
  'modal.adopt.sub':{en:'Give your new animal a name',vi:'Đặt tên cho thú cưng mới'},
  'modal.btn.cancel':{en:'Cancel',vi:'Huỷ'},
  'modal.btn.save':{en:'Save',vi:'Lưu'},
  'modal.btn.adopt':{en:'Adopt',vi:'Nhận nuôi'},
  'modal.viral.title':{en:'Going viral!',vi:'Đang gây sốt!'},
  'modal.viral.sub':{en:'{name} stole the show 💛',vi:'{name} chiếm trọn spotlight 💛'},
  'modal.viral.bonus':{en:'+{n} 🪙 viral bonus',vi:'+{n} 🪙 thưởng lan toả'},
  'modal.show.title':{en:'Showtime!',vi:'Giờ biểu diễn!'},
  'modal.show.crowd':{en:'Crowd bonus ×{n} from animal trust',vi:'Thưởng khán giả ×{n} từ độ tin tưởng'},
  'modal.show.revenue':{en:'Revenue',vi:'Doanh thu'},
  'modal.show.rep':{en:'Reputation',vi:'Danh tiếng'},
  'modal.show.xp':{en:'Zoo XP',vi:'XP Sở thú'},
  'modal.show.bow':{en:'Take a bow 🎤',vi:'Cúi chào 🎤'},
  'scr.misc.cap':{en:'Live idle zoo — watch it run, then tap in.',vi:'Sở thú idle trực tiếp — xem nó chạy, rồi chạm vào chơi.'},
  'scr.misc.artnote_h':{en:'Art direction note',vi:'Ghi chú định hướng nghệ thuật'},
  'scr.misc.artnote_b':{en:'Final build replaces these emoji stand-ins with cute stylized-3D animals, an isometric zoo diorama, strolling visitor crowds and high-quality idle animations. Layout, motion intent and the live idle loop shown here are production-intent.',vi:'Bản hoàn chỉnh sẽ thay các emoji tạm này bằng thú 3D cách điệu dễ thương, mô hình sở thú góc nhìn isometric, dòng khách dạo bước và hoạt ảnh idle chất lượng cao. Bố cục, ý đồ chuyển động và vòng lặp idle ở đây là định hướng sản xuất.'},
  // ── prototype.jsx: flash toasts (fx.*) ─────────────────────
  'fx.renamed':{en:'✏️ Renamed',vi:'✏️ Đã đổi tên'},
  'fx.tut_skipped':{en:'Guided tips skipped — replay anytime ❔',vi:'Đã bỏ qua hướng dẫn — xem lại bất cứ lúc nào ❔'},
  'fx.tut_replay':{en:'↺ Replaying the guide',vi:'↺ Đang phát lại hướng dẫn'},
  'fx.enc_full':{en:'Enclosure full — upgrade it first',vi:'Chuồng đã đầy — nâng cấp trước đã'},
  'fx.need_gold':{en:'Need {cost} 🪙',vi:'Cần {cost} 🪙'},
  'fx.plus_one_animal':{en:'🐾 +1 {name}',vi:'🐾 +1 {name}'},
  'fx.enc_max':{en:'🏗️ Max enclosure level ({max})',vi:'🏗️ Chuồng đã đạt cấp tối đa ({max})'},
  'fx.enc_upgraded':{en:'🏗️ Enclosure → Lv {lv} (+slot & appeal)',vi:'🏗️ Chuồng → Lv {lv} (+chỗ & sức hút)'},
  'fx.stat_full':{en:"{species}'s {stat} is already full!",vi:'{stat} của {species} đã đầy rồi!'},
  'fx.care_feed':{en:'🍖 Fed',vi:'🍖 Đã cho ăn'},
  'fx.care_water':{en:'💧 Watered',vi:'💧 Đã cho uống'},
  'fx.care_clean':{en:'🫧 Bathed',vi:'🫧 Đã tắm'},
  'fx.care_play':{en:'🎾 Played',vi:'🎾 Đã chơi'},
  'fx.care_heal':{en:'➕ Vaccinated',vi:'➕ Đã khám'},
  'fx.care_paid':{en:'{label} · −{cost} 🪙',vi:'{label} · −{cost} 🪙'},
  'fx.reach_lv':{en:'Reach Lv {lv} first',vi:'Đạt Lv {lv} trước đã'},
  'fx.welcome_animal':{en:'🎉 Welcome, {name}!',vi:'🎉 Chào mừng, {name}!'},
  'fx.chapter_done':{en:'🏅 Chapter {ch} done! +{gold} 🪙',vi:'🏅 Hoàn thành Chương {ch}! +{gold} 🪙'},
  'fx.reach_lv_build':{en:'🔒 Reach Lv {lv} to build {name}',vi:'🔒 Đạt Lv {lv} để xây {name}'},
  'fx.need_gold_build':{en:'Need {cost} 🪙 to build',vi:'Cần {cost} 🪙 để xây'},
  'fx.attraction_built_act':{en:'{icon} {name} built · {acts} activities open!',vi:'{icon} Đã xây {name} · mở hoạt động {acts}!'},
  'fx.attraction_built':{en:'{icon} {name} built!',vi:'{icon} Đã xây {name}!'},
  'fx.activity_done':{en:'{name} ✓ +{gold} 🪙',vi:'{name} ✓ +{gold} 🪙'},
  'fx.vip_served':{en:'🤵 VIP served! +{gold} 🪙',vi:'🤵 Đã phục vụ VIP! +{gold} 🪙'},
  'fx.vip_name':{en:'Your VIP guest',vi:'Khách VIP của bạn'},
  'fx.enrich_max':{en:'✨ Max enrichment (Lv {max})',vi:'✨ Làm phong phú tối đa (Lv {max})'},
  'fx.enrich_up':{en:'✨ {species} enrichment Lv {lv} — happier & more appealing!',vi:'✨ {species} làm phong phú Lv {lv} — vui hơn & hút khách hơn!'},
  'fx.service_done':{en:'🛎️ {title} ✓ +{gold} 🪙',vi:'🛎️ {title} ✓ +{gold} 🪙'},
  'fx.admin_level':{en:'🛠️ Level → {lv}',vi:'🛠️ Cấp → {lv}'},
  'fx.admin_all_unlocked':{en:'All unlocked',vi:'Đã mở khoá tất cả'},
  'fx.admin_unlocked':{en:'🛠️ Unlocked {species}',vi:'🛠️ Đã mở khoá {species}'},
  'fx.admin_unlock_all':{en:'🛠️ All animals unlocked',vi:'🛠️ Đã mở khoá toàn bộ thú'},
  'fx.game_reset':{en:'↺ Game reset',vi:'↺ Đã đặt lại trò chơi'},
  'fx.shop_bought_gold':{en:'🪙 +{gold} for 💎 {gems}',vi:'🪙 +{gold} đổi 💎 {gems}'},
  'fx.shop_need_gems':{en:'Need 💎 {gems}',vi:'Cần 💎 {gems}'},
};
for (const k in _EXT){ if(_EXT[k].en!=null) I18N.en[k]=_EXT[k].en; if(_EXT[k].vi!=null) I18N.vi[k]=_EXT[k].vi; }

function t(key, vars){
  const lang = (typeof window!=='undefined' && window.__lang) || 'en';
  let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  if (vars) for (const k in vars) s = s.split('{'+k+'}').join(vars[k]);
  return s;
}
// ---- player settings (sound / volume / language) — persisted separately from the game save ----
const SETTINGS_KEY = 'awz_settings';
function loadSettings(){ try{ return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }catch(e){ return {}; } }
function saveSettings(s){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }catch(e){} }
(function(){ const s = loadSettings();
  window.__lang    = s.lang || 'en';
  window.__vol     = (s.vol != null) ? s.vol : 1;       // 0..1 master volume
  window.__soundOn = (s.sound != null) ? s.sound : true;
})();

// ---- Care stats (5) ----------------------------------------
const STATS = [
  { key:'hunger', name:'Hunger',      icon:'🍖', color:'#EF4B5C', desc:'Decays −6/hr. Low hunger cuts happiness (→ appeal) & XP gain.' },
  { key:'thirst', name:'Thirst',      icon:'💧', color:'#34B6F0', desc:'Decays −8/hr. Fastest-draining need; cheap to top up.' },
  { key:'clean',  name:'Cleanliness', icon:'🫧', color:'#36C98A', desc:'Habitat hygiene. Dirty pens lower visitor satisfaction.' },
  { key:'happy',  name:'Happiness',   icon:'😊', color:'#FFB22E', desc:'Outcome of all needs + decor. Drives visitor appeal.' },
  { key:'trust',  name:'Trust',       icon:'❤️', color:'#FF7FA8', desc:'Built slowly through daily care. Gates attractions & performance.' },
];

// ---- Care actions (6) --------------------------------------
const ACTIONS = [
  { key:'feed',  name:'Feed',   icon:'🍖', color:'#EF4B5C', cost:40, effect:{hunger:+100}, stat:'hunger', note:'Buy food — price scales with species.' },
  { key:'water', name:'Water',  icon:'💧', color:'#34B6F0', cost:10, effect:{thirst:+100}, stat:'thirst', note:'Refill the water trough.' },
  { key:'clean', name:'Bathe',  icon:'🫧', color:'#36C98A', cost:20, effect:{clean:+100}, stat:'clean', note:'Bathe & clean the habitat.' },
  { key:'play',  name:'Play',   icon:'🎾', color:'#FFB22E', cost:0,  effect:{happy:+100, trust:+4}, stat:'happy', note:'Boosts happiness & a little trust.' },
  { key:'heal',  name:'Health', icon:'➕', color:'#7C5CFF', cost:30, effect:{happy:+40, trust:+2}, stat:'happy', note:'Vet check / vaccinate; clears sickness.' },
];

// ---- Taming difficulty -------------------------------------
const TAMING = {
  'Very Easy': { rank:1, color:'#36C98A', time:'instant',  note:'Tames on adopt.' },
  'Easy':      { rank:2, color:'#7FC241', time:'2–4 h',    note:'Light daily care.' },
  'Medium':    { rank:3, color:'#FFB22E', time:'1–2 days', note:'Sustained trust needed.' },
  'Hard':      { rank:4, color:'#F2960B', time:'3–5 days', note:'Better facilities required.' },
  'Expert':    { rank:5, color:'#EF7B4B', time:'1–2 wks',  note:'High zoo level + specialist habitat.' },
  'Master':    { rank:6, color:'#EF4B5C', time:'3+ wks',   note:'Endgame challenge animals.' },
};

// ---- Animal roster (7 tiers) -------------------------------
// appeal = visitor draw (how attractive this animal makes the zoo). Higher tier = rarer = more
//          appealing. Appeal → visitors → gold/hr (see the ZOO ECONOMY MODEL in prototype.jsx).
//          Values are monotonic with unlock level so a later animal is always at least as appealing.
// perform = eligible for the Performance attraction.
const ANIMALS = [
  // Starter
  { key:'rabbit',  emoji:'🐰', name:'Clover',  species:'Rabbit',       tier:0, habitat:'meadow', taming:'Very Easy', appeal:3,     unlock:'Start',   perform:false, bg:'#FFE0E6' },
  { key:'chicken', emoji:'🐔', name:'Henrietta',species:'Chicken',     tier:0, habitat:'meadow', taming:'Very Easy', appeal:8,     unlock:'Start',   perform:false, bg:'#FFEFC2' },
  { key:'duck',    emoji:'🦆', name:'Puddles', species:'Duck',         tier:0, habitat:'meadow', taming:'Very Easy', appeal:14,    unlock:'Tutorial',perform:false, bg:'#D4ECF5' },
  { key:'dog',     emoji:'🐶', name:'Biscuit', species:'Dog',          tier:0, habitat:'meadow', taming:'Very Easy', appeal:30,    unlock:'Lv3',     perform:true,  bg:'#FFE6C7' },
  // Tier 1
  { key:'cat',     emoji:'🐱', name:'Mittens', species:'Cat',          tier:1, habitat:'meadow', taming:'Easy',   appeal:50,    unlock:'Lv5',     perform:false, bg:'#FFE0CC' },
  { key:'goat',    emoji:'🐐', name:'Pebble',  species:'Goat',         tier:1, habitat:'pasture',taming:'Easy',   appeal:70,    unlock:'Lv6',     perform:false, bg:'#ECE4D6' },
  { key:'sheep',   emoji:'🐑', name:'Cloud',   species:'Sheep',        tier:1, habitat:'pasture',taming:'Easy',   appeal:85,    unlock:'Lv8',     perform:false, bg:'#F0EFEA' },
  // Tier 2
  { key:'horse',   emoji:'🐴', name:'Comet',   species:'Horse',        tier:2, habitat:'pasture',taming:'Easy',   appeal:130,   unlock:'Lv11',    perform:false, bg:'#E8D8C4' },
  { key:'donkey',  emoji:'🫏', name:'Jasper',  species:'Donkey',       tier:2, habitat:'pasture',taming:'Easy',   appeal:150,   unlock:'Lv13',    perform:false, bg:'#E2D6C8' },
  { key:'alpaca',  emoji:'🦙', name:'Tofu',    species:'Alpaca',       tier:2, habitat:'pasture',taming:'Medium', appeal:170,   unlock:'Lv15',    perform:false, bg:'#F2E2D0' },
  { key:'cow',     emoji:'🐄', name:'Daisy',   species:'Cow',          tier:2, habitat:'pasture',taming:'Easy',   appeal:190,   unlock:'Lv17',    perform:false, bg:'#EFEAE2' },
  // Tier 3
  { key:'fox',     emoji:'🦊', name:'Ember',   species:'Fox',          tier:3, habitat:'woodland',taming:'Medium',appeal:230,   unlock:'Lv20',    perform:false, bg:'#FFD9C2' },
  { key:'monkey',  emoji:'🐵', name:'Mango',   species:'Monkey',       tier:3, habitat:'woodland',taming:'Medium',appeal:260,   unlock:'Lv23',    perform:true,  bg:'#FFE0CC' },
  { key:'raccoon', emoji:'🦝', name:'Bandit',  species:'Raccoon',      tier:3, habitat:'woodland',taming:'Medium',appeal:290,   unlock:'Lv25',    perform:false, bg:'#E7E2DA' },
  { key:'wolf',    emoji:'🐺', name:'Shadow',  species:'Wolf',         tier:3, habitat:'woodland',taming:'Hard',  appeal:330,   unlock:'Lv28',    perform:false, bg:'#DDE2E8' },
  // Tier 4
  { key:'zebra',   emoji:'🦓', name:'Pyjama',  species:'Zebra',        tier:4, habitat:'savanna',taming:'Medium', appeal:400,   unlock:'Lv32',    perform:false, bg:'#ECECEC' },
  { key:'giraffe', emoji:'🦒', name:'Stretch', species:'Giraffe',      tier:4, habitat:'savanna',taming:'Hard',   appeal:470,   unlock:'Lv36',    perform:false, bg:'#FFE7B3' },
  { key:'rhino',   emoji:'🦏', name:'Tank',    species:'Rhinoceros',   tier:4, habitat:'savanna',taming:'Hard',   appeal:540,   unlock:'Lv40',    perform:false, bg:'#DEDEE2' },
  { key:'hippo',   emoji:'🦛', name:'Bubbles', species:'Hippopotamus', tier:4, habitat:'savanna',taming:'Hard',   appeal:610,   unlock:'Lv44',    perform:false, bg:'#D8DDE2' },
  { key:'lion',    emoji:'🦁', name:'Leo',     species:'Lion',         tier:4, habitat:'savanna',taming:'Expert', appeal:700,   unlock:'Lv48',    perform:false, bg:'#FFE3B3' },
  // Tier 5
  { key:'elephant',emoji:'🐘', name:'Nellie',  species:'Elephant',     tier:5, habitat:'savanna',taming:'Hard',   appeal:850,   unlock:'Lv54',    perform:true,  bg:'#DDE7F0' },
  { key:'brownbear',emoji:'🐻',name:'Barnaby', species:'Brown Bear',   tier:5, habitat:'polar',  taming:'Expert', appeal:1000,  unlock:'Lv60',    perform:false, bg:'#EADBC8' },
  { key:'polarbear',emoji:'🐻‍❄️',name:'Frost', species:'Polar Bear',   tier:5, habitat:'polar',  taming:'Expert', appeal:1150,  unlock:'Lv66',    perform:false, bg:'#E3EEF7' },
  // Tier 6
  { key:'turtle',  emoji:'🐢', name:'Shelly',  species:'Turtle',       tier:6, habitat:'reptile',taming:'Easy',   appeal:1350,  unlock:'Lv70',    perform:false, bg:'#D7F0E2' },
  { key:'python',  emoji:'🐍', name:'Noodle',  species:'Python',       tier:6, habitat:'reptile',taming:'Expert', appeal:1550,  unlock:'Lv74',    perform:false, bg:'#E0EAD4' },
  { key:'croc',    emoji:'🐊', name:'Snap',    species:'Crocodile',    tier:6, habitat:'reptile',taming:'Master', appeal:1800,  unlock:'Lv80',    perform:false, bg:'#D4E4D0' },
  // Tier 7
  { key:'seal',    emoji:'🦭', name:'Pearl',   species:'Seal',         tier:7, habitat:'marine', taming:'Hard',   appeal:2100,  unlock:'Lv84',    perform:true,  bg:'#D4ECF5' },
  { key:'sealion', emoji:'🦭', name:'Captain', species:'Sea Lion',     tier:7, habitat:'marine', taming:'Expert', appeal:2500,  unlock:'Lv88',    perform:true,  bg:'#CFE6F2' },
  { key:'dolphin', emoji:'🐬', name:'Echo',    species:'Dolphin',      tier:7, habitat:'marine', taming:'Expert', appeal:3000,  unlock:'Lv92',    perform:true,  bg:'#D4ECF5' },
];

const TIERS = [
  { t:0, name:'Starter',  theme:'Local farm corner', span:'Lv1–4' },
  { t:1, name:'Tier 1',   theme:'Friendly companions', span:'Lv5–10' },
  { t:2, name:'Tier 2',   theme:'Farmstead & pasture', span:'Lv11–19' },
  { t:3, name:'Tier 3',   theme:'Woodland natives', span:'Lv20–31' },
  { t:4, name:'Tier 4',   theme:'African savanna', span:'Lv32–53' },
  { t:5, name:'Tier 5',   theme:'Giants & bears', span:'Lv54–69' },
  { t:6, name:'Tier 6',   theme:'Reptile house', span:'Lv70–83' },
  { t:7, name:'Tier 7',   theme:'Marine cove', span:'Lv84–92' },
];

// ---- Habitats ----------------------------------------------
const HABITATS = [
  { key:'meadow',  name:'Meadow',       icon:'🌾', tint:'#E3F2DC', unlock:'Start',  holds:'Rabbit · Chicken · Duck · Dog · Cat' },
  { key:'pasture', name:'Pasture',      icon:'🐎', tint:'#EFEAD8', unlock:'Lv6',    holds:'Goat · Sheep · Horse · Donkey · Alpaca · Cow' },
  { key:'woodland',name:'Woodland',     icon:'🌲', tint:'#DDEAD9', unlock:'Lv20',   holds:'Fox · Monkey · Raccoon · Wolf' },
  { key:'savanna', name:'Savanna',      icon:'🌅', tint:'#FBE6C9', unlock:'Lv32',   holds:'Zebra · Giraffe · Rhino · Hippo · Lion · Elephant' },
  { key:'polar',   name:'Polar Peaks',  icon:'❄️', tint:'#E3EEF7', unlock:'Lv60',   holds:'Brown Bear · Polar Bear' },
  { key:'reptile', name:'Reptile House',icon:'🦎', tint:'#E0EAD4', unlock:'Lv70',   holds:'Turtle · Python · Crocodile' },
  { key:'marine',  name:'Marine Cove',  icon:'🌊', tint:'#D4ECF5', unlock:'Lv84',   holds:'Seal · Sea Lion · Dolphin' },
];
// habitat upgrade ladder (per habitat)
const HAB_UPGRADE = [
  { lv:1, slots:2, income:'×1.0', cost:'—' },
  { lv:2, slots:3, income:'×1.3', cost:'2,500 🪙' },
  { lv:3, slots:4, income:'×1.7', cost:'14,000 🪙' },
  { lv:4, slots:5, income:'×2.2', cost:'68,000 🪙' },
  { lv:5, slots:6, income:'×3.0', cost:'320,000 🪙' },
];

// ---- Attractions -------------------------------------------
// cost is monotonic with unlock level (earlier = cheaper). Every attraction adds the
// SAME +12% revenue / +15% capacity via the built-count in prototype.jsx — the per-row
// "effect" copy below is a flavour label, NOT a distinct formula (tracked: Fe4 differentiation).
const ATTRACTIONS = [
  { key:'petting',  name:'Petting Area',     icon:'🤲', unlock:'Lv7',  cost:500,   effect:'+12% visitors', desc:'Visitors interact with Very Easy / Easy animals. Needs Trust ≥ 40.' },
  { key:'feeding',  name:'Feeding Zone',     icon:'🥕', unlock:'Lv18', cost:2500,  effect:'+12% revenue',  desc:'Visitors buy food to feed selected animals — a steady gold tap.' },
  { key:'shows',    name:'Educational Shows',icon:'🎤', unlock:'Lv26', cost:8000,  effect:'+12% revenue',  desc:'Animals demonstrate natural behaviours on a timed schedule.' },
  { key:'rides',    name:'Animal Rides',     icon:'🐎', unlock:'Lv30', cost:16000, effect:'+12% revenue',  desc:'Horse · donkey · elephant rides. Premium ticket.' },
  { key:'perform',  name:'Performance Arena',icon:'🎪', unlock:'Lv45', cost:45000, effect:'+12% revenue',  desc:'Trained, high-trust animals perform routines. The marquee attraction.' },
];

// ---- Performance (late-game) -------------------------------
const PERF_SKILLS = ['Ball balancing','Dancing','Jumping','Fetching','Team routines'];
const PERFORMERS = ['Dog','Monkey','Elephant','Seal','Sea Lion','Dolphin']; // matches every ANIMALS entry with perform:true

// ---- Currencies --------------------------------------------
const CURRENCIES = [
  { key:'gold', name:'Gold',          icon:'🪙', type:'Soft',    bg:'#FFEFC2', use:'Care, habitat & facility upgrades, animal unlocks' },
  { key:'gems', name:'Gems',          icon:'💎', type:'Hard',    bg:'#D4ECF5', use:'Speed-ups, cosmetics, VIP, decor themes (never animals)' },
  { key:'xp',   name:'Zoo XP',        icon:'⭐', type:'Level',   bg:'#E8E0FF', use:'Raises global Zoo Level — gates all content' },
  { key:'tokens',name:'Conservation', icon:'🌿', type:'Event',   bg:'#D7F0E2', use:'Event shop · seasonal animals & decor' },
  { key:'rep',  name:'Reputation',    icon:'🏅', type:'Meter',   bg:'#FFE3B3', use:'Star rating — multiplies visitor count (not spent)' },
];

// ---- Economy: sources & sinks ------------------------------
const SOURCES = [
  { src:'Visitor gate income',  cur:'Gold', rate:'passive / sec',   note:'Σ animal appeal → visitors × spend/head × attractions.' },
  { src:'Idle / offline',       cur:'Gold', rate:'~60% active rate',note:'Cap 8h free · 24h VIP. Deliberately modest.' },
  { src:'Attraction revenue',   cur:'Gold', rate:'per attraction',  note:'Feeding, rides & shows stack multipliers.' },
  { src:'Care & objectives',    cur:'Zoo XP',rate:'steady',         note:'Every feed, clean & milestone grants XP.' },
  { src:'Daily missions',       cur:'Gems', rate:'5–15 / day',      note:'Small, reliable hard-currency trickle.' },
  { src:'Seasonal events',      cur:'Tokens',rate:'event track',    note:'Limited conservation animals & decor.' },
];
const SINKS = [
  { sink:'Animal care',         cur:'Gold', cost:'25–600 / action', note:'Constant low-grade drain; scales with tier.' },
  { sink:'Habitat upgrade',     cur:'Gold', cost:'2.5k–320k',       note:'Primary long-term sink — slots & income.' },
  { sink:'Facility upgrade',    cur:'Gold', cost:'5k–500k',         note:'Food, water, vet, ticket office.' },
  { sink:'Animal unlock',       cur:'Gold', cost:'0.5k–250k',       note:'Gated by Zoo Level — earned, never sold.' },
  { sink:'Attraction build',    cur:'Gold', cost:'40k–900k',        note:'Big milestone purchases.' },
  { sink:'Speed-up / cosmetic', cur:'Gems', cost:'5–600',           note:'Convenience & decor only.' },
];

// ---- Zoo Level milestones ----------------------------------
const LEVELS = [
  { lv:1,  xp:0,       unlock:'Meadow habitat · Rabbit · ticket gate' },
  { lv:7,  xp:5200,    unlock:'Petting Area · Cat · daily missions' },
  { lv:18, xp:42000,   unlock:'Feeding Zone · Pasture full · Tier 2' },
  { lv:30, xp:210000,  unlock:'Animal Rides · Woodland · Tier 3' },
  { lv:45, xp:980000,  unlock:'Performance Arena · Lion · Tier 4' },
  { lv:60, xp:3600000, unlock:'Polar Peaks · bears · Tier 5' },
  { lv:84, xp:18000000,unlock:'Marine Cove · Tier 7 · endgame loop' },
];

// ---- Idle --------------------------------------------------
const IDLE = [
  { k:'Gold',          v:'~60% of active', note:'Visitor gate keeps earning while away.' },
  { k:'Zoo XP',        v:'reduced trickle',note:'Care XP pauses; only passive milestones bank.' },
  { k:'Attraction rev',v:'full',           note:'Attractions run autonomously offline.' },
  { k:'Cap',           v:'8h free / 24h VIP',note:'Modest cap nudges a daily return.' },
];

// ---- Retention ---------------------------------------------
const FUNNEL = [ { d:'D1', pct:42 }, { d:'D7', pct:22 }, { d:'D30', pct:12 }, { d:'D90', pct:6 } ];
const ACTIVITIES = {
  daily:  ['Collect gate income','Feed & water all animals','Clean 3 habitats','Complete 1 show','Claim daily login'],
  weekly: ['Earn 2M gold','Raise 1 animal to max trust','Upgrade a habitat','Finish weekly mission set'],
  monthly:['Seasonal event clear','Unlock the month\u2019s feature animal','Conservation milestone','Photo-mode contest'],
};

// ---- LiveOps events ----------------------------------------
const EVENTS = [
  { name:'Spring Hatchlings', icon:'🌸', when:'Mar–Apr', len:'14 days', reward:'Baby-animal decor + Peacock', mechanic:'Hatch eggs by completing care streaks' },
  { name:'Safari Summer',     icon:'🌞', when:'Jun–Jul', len:'18 days', reward:'Cheetah (conservation)',      mechanic:'Expedition map; tokens from savanna shows' },
  { name:'Spooky Night Zoo',  icon:'🎃', when:'Oct',     len:'10 days', reward:'Bat habitat theme',           mechanic:'After-dark visitor mode, candy goals' },
  { name:'Winter Conservation',icon:'❄️',when:'Dec–Jan', len:'21 days', reward:'Red Panda + snow decor',      mechanic:'Co-op donation drive, advent gifts' },
];
const CADENCE = [
  { cad:'Daily',    items:'Login · 5 missions · shop deal · rewarded-ad gold boost' },
  { cad:'Weekly',   items:'4 weekly missions · weekend 2× idle · featured habitat' },
  { cad:'Monthly',  items:'Seasonal event · feature animal · conservation milestone' },
  { cad:'Quarterly',items:'New tier or biome · balance pass · endgame content drop' },
];

// ---- Monetization ------------------------------------------
const IAP = [
  { name:'Pouch of Gems',  gems:80,    price:'$0.99',  best:false },
  { name:'Bag',            gems:500,   price:'$4.99',  best:false },
  { name:'Keeper\u2019s Chest', gems:1200, price:'$9.99', best:true },
  { name:'Director Vault', gems:2600,  price:'$19.99', best:false },
  { name:'Patron Crate',   gems:7000,  price:'$49.99', best:false },
  { name:'Founder Hoard',  gems:16000, price:'$99.99', best:false },
];
const OFFERS = [
  { name:'Starter Decor Bundle', price:'$2.99',   contents:'Premium meadow theme + 400💎', tag:'One-time · 1st week' },
  { name:'Event Pass',           price:'$4.99',   contents:'Premium event track + cosmetic animal skin', tag:'Per event' },
  { name:'VIP Membership',       price:'$7.99/mo',contents:'24h idle cap, 2× daily gems, no ads, VIP decor', tag:'Subscription' },
  { name:'Habitat Theme Pack',   price:'$5.99',   contents:'Exclusive biome reskin (cosmetic)', tag:'Cosmetic' },
];
const KPI = [
  { label:'Target ARPDAU',   value:'$0.09',  delta:'blended (cosmetic-led)' },
  { label:'Payer conversion',value:'2.6%',   delta:'D30 cohort' },
  { label:'D1 / D7 / D30',   value:'42/22/12',unit:'%', delta:'retention' },
  { label:'Avg session',     value:'5.4',    unit:'min', delta:'2.8 sessions/day' },
];

// ---- Tutorial (7 steps, from brief) ------------------------
const TUTORIAL = [
  { t:'Welcome',          d:'Intro the zoo & the first Meadow habitat.', reward:'1 Rabbit' },
  { t:'Feed the rabbit',  d:'Guided tap on the hunger meter → Feed.',    reward:'Gold' },
  { t:'Clean the habitat',d:'Guided tap → Clean the Meadow.',            reward:'Zoo XP' },
  { t:'Collect income',   d:'Tap the floating gold at the gate.',        reward:'Unlock Duck' },
  { t:'Upgrade Habitat A',d:'Spend gold to add an animal slot.',         reward:'+1 slot' },
  { t:'Visitor happiness', d:'Explain how needs → satisfaction → income.',reward:'Starter decoration' },
  { t:'Zoo level',        d:'Introduce global level progression.',       reward:'Unlock Daily Missions' },
];

// ---- 90-day journey ----------------------------------------
const PLAN90 = [
  { day:'D1',     lv:'Lv1–4',   focus:'FTUE, first 4 starter animals, first habitat upgrade', goal:'Finish tutorial, collect first idle reward' },
  { day:'D2–7',   lv:'Lv5–10',  focus:'Petting Area, Tier 1, daily mission habit',            goal:'D7 return; first attraction live' },
  { day:'D8–30',  lv:'Lv11–22', focus:'Pasture & Woodland, Feeding Zone, first event',        goal:'First Tier 3 animal; event participation' },
  { day:'D31–60', lv:'Lv23–38', focus:'Savanna opens, Rides + Shows, trust grinding',         goal:'First Tier 4 (zebra→lion path)' },
  { day:'D61–90', lv:'Lv39–50', focus:'Performance Arena, reputation push, collection chase', goal:'Lion tamed; arena performing' },
];

// ---- 12-month roadmap --------------------------------------
const ROADMAP = [
  { q:'Launch', title:'Gates open',     items:['Meadow→Savanna (4 biomes)','Tiers 0–4 roster','Petting/Feeding/Rides/Shows','Daily & weekly missions'] },
  { q:'Q1',     title:'Conservation',   items:['Spring Hatchlings event','Performance Arena','Reputation star system','Photo mode'] },
  { q:'Q2',     title:'Go wild',        items:['Polar Peaks + Tier 5','Safari Summer event','Friends & gifting','Decor cosmetics v2'] },
  { q:'Q3',     title:'Cold-blooded',   items:['Reptile House + Tier 6','Spooky Night Zoo','Daily challenge zoo','Leaderboards'] },
  { q:'Q4',     title:'Into the deep',  items:['Marine Cove + Tier 7','Winter Conservation','Endgame prestige (Zoo Tour)','Guild conservation drives'] },
];

// ---- Endgame -----------------------------------------------
const ENDGAME = [
  ['🌍 Sister Zoos','Open themed satellite parks that share staff & feed a meta-currency.'],
  ['♻️ Prestige (Zoo Tour)','Soft-reset for permanent income & XP multipliers; keeps collection.'],
  ['🏅 Reputation tiers','Bronze→Diamond zoo ranking with cosmetic frames & visitor caps.'],
  ['🧬 Breeding & lineage','Pair high-trust animals for rare colour-morph offspring.'],
  ['🤝 Conservation guilds','Co-op donation drives unlocking shared endangered species.'],
  ['📒 Master collection','Complete every tier + morph for a Master Curator badge.'],
];

// ---- Technical architecture --------------------------------
const TECH = [
  ['Engine','Unity (URP) for stylised-3D animals; addressable asset bundles per biome to keep install small.'],
  ['Client state','Local authoritative sim with deterministic idle accrual; protobuf save blob.'],
  ['Backend','Managed serverless (player profile, inventory, IAP receipts, events) + cloud save.'],
  ['Idle math','Server timestamp on app-close; offline gold = rate × min(Δt, cap). No client trust for currency.'],
  ['LiveOps','Remote-config event calendar, balance tables & feature flags — no client update to ship events.'],
  ['Economy data','All tables (animals/habitats/attractions) are remote-config JSON, hot-swappable.'],
  ['Analytics','Funnel, sink/source ledger, per-animal engagement; A/B on pacing & offers.'],
  ['Monetization','Store SDK + receipt validation; rewarded-ad mediation (opt-in only).'],
];

// ---- MVP scope ---------------------------------------------
const MVP = {
  in: ['Meadow + Pasture habitats','Tiers 0–2 (11 animals)','Care loop (5 needs, 6 actions)','Visitor gate income + idle','Habitat upgrades','Petting Area + Feeding Zone','Zoo Level 1–20','7-step tutorial','Daily missions + login','Cloud save + IAP gem packs'],
  out:['Performance Arena','Tiers 4–7 & their biomes','Breeding/lineage','Guilds & co-op','Prestige','Seasonal events (post-launch)'],
  why:'Proves the core loop — care → satisfaction → income → upgrade → unlock — and the idle hook, with enough collection runway (11 animals) to validate D7/D30 before investing in late-game biomes.',
};

// ---- Data tables (samples) ---------------------------------
const DT_ANIMALS = ANIMALS;
const DT_HAB = HAB_UPGRADE;

// ---- Animals per enclosure (consistent count per species) --
const ENC_COUNTS = {
  rabbit:3, chicken:3, duck:2, dog:1, cat:2, goat:2, sheep:3, horse:1, donkey:1, alpaca:2,
  cow:2, fox:1, monkey:2, raccoon:2, wolf:2, zebra:2, giraffe:1, rhino:1, hippo:1, lion:2,
  elephant:1, brownbear:1, polarbear:1, turtle:2, python:1, croc:1, seal:2, sealion:1, dolphin:2,
};

const MAX_LEVEL = 92;
const MAX_ENCLOSURE_LEVEL = 5;   // enclosure upgrades cap at Lv5 (6 slots, ×2.0 appeal)
const MAX_ENRICH_LEVEL = 5;      // enrichment caps at Lv5 (+50% appeal) — prevents unbounded appeal
// trust gates (enforced in code): caring for an animal unlocks its attraction roles
const TRUST_PETTING = 40;        // min trust for an animal to join the Petting Area
const TRUST_PERFORM = 80;        // min trust for an animal to perform on stage
// round to friendly increments so generated values read like hand-authored ones
const roundNice = (x)=> x>=10000 ? Math.round(x/500)*500 : x>=1000 ? Math.round(x/100)*100 : Math.round(x/10)*10;

// ---- Zoo Level XP curve (cumulative XP to reach each level) -
// Single source of truth: the LEVELS milestones above ARE the pacing anchors.
// LEVEL_XP is generated from them — one cumulative-XP entry per level, Lv1..MAX_LEVEL
// — so the per-level curve and the milestone table can never disagree, and the curve
// no longer caps the game at Lv15. Tune pacing by editing the LEVELS xp values.
const LEVEL_XP = (()=>{
  const anchors = LEVELS.map(l=>({ lv:l.lv, xp:l.xp }));
  const arr = new Array(MAX_LEVEL);
  arr[0] = 0;
  for (let s=0; s<anchors.length-1; s++){
    const a = anchors[s], b = anchors[s+1];
    for (let lv=a.lv+1; lv<=b.lv; lv++){
      const f = (lv - a.lv) / (b.lv - a.lv);
      // geometric interpolation between anchors; first segment ramps up from 0
      const x = a.xp > 0 ? a.xp * Math.pow(b.xp / a.xp, f) : b.xp * Math.pow(f, 2.2);
      arr[lv-1] = roundNice(x);
    }
  }
  // Extend past the last milestone using that segment's per-level growth ratio.
  const last = anchors[anchors.length-1], prev = anchors[anchors.length-2];
  const perLv = Math.pow(last.xp / prev.xp, 1 / (last.lv - prev.lv));
  for (let lv=last.lv+1; lv<=MAX_LEVEL; lv++) arr[lv-1] = roundNice(arr[lv-2] * perLv);
  return arr;
})();

// ---- Unlock order: derived from ANIMALS (rabbit is the free starter) ---------
// Single source of truth = ANIMALS[].unlock. This projection gives the prototype
// the level gate (lv) + gold cost it needs to gate/buy each animal, so UNLOCKS and
// ANIMALS can never drift apart. Gold scales geometrically with the unlock level.
const UNLOCKS = ANIMALS
  .filter(a => a.key !== 'rabbit')
  .map(a => {
    const lv = (a.unlock === 'Start' || a.unlock === 'Tutorial')
      ? 1
      : (parseInt(String(a.unlock).replace(/\D/g,''), 10) || 1);
    return { key:a.key, lv, gold: roundNice(500 * Math.pow(1.06, lv - 1)) };
  })
  .sort((x,y) => x.lv - y.lv || x.gold - y.gold);

// ---- New Player Quests (7 chapters; obj types map to tracked counters) -
const QUESTS = [
  { ch:1, title:'Welcome to the Zoo', purpose:'Introduce the basic gameplay loop.',
    obj:[ {t:'feed',n:1,label:'Feed an animal'}, {t:'owned',n:2,label:'Adopt a 2nd animal'}, {t:'clean',n:1,label:'Clean a habitat'} ],
    rw:{ gold:200, xp:300 } },
  { ch:2, title:'Growing the Zoo', purpose:'Teach animal care systems.',
    obj:[ {t:'owned',n:2,label:'Own 2 animals'}, {t:'feed',n:2,label:'Feed animals 2 times'}, {t:'clean',n:2,label:'Clean habitats 2 times'} ],
    rw:{ gold:400, xp:550 } },
  { ch:3, title:'First Expansion', purpose:'Introduce zoo expansion.',
    obj:[ {t:'owned',n:5,label:'Own 5 animals'}, {t:'level',n:3,label:'Reach Zoo Level 3'} ],
    rw:{ gold:1200, xp:850 } },
  { ch:4, title:'Happy Visitors', purpose:'Introduce entertainment activities.',
    obj:[ {t:'photo',n:2,label:'Complete 2 Photo activities'}, {t:'feeding',n:2,label:'Complete 2 Feeding activities'}, {t:'vip',n:1,label:'Serve 1 VIP visitor'} ],
    rw:{ gold:600, xp:1200 } },
  { ch:5, title:'New Attractions', purpose:'Introduce attraction gameplay.',
    obj:[ {t:'ride',n:1,label:'Run an Animal Ride'}, {t:'activity',n:2,label:'Complete 2 activities'}, {t:'level',n:5,label:'Reach Zoo Level 5'} ],
    rw:{ gold:1500, xp:1600 } },
  { ch:6, title:'Building a Real Zoo', purpose:'Prepare for mid-game progression.',
    obj:[ {t:'owned',n:10,label:'Own 10 species'}, {t:'level',n:8,label:'Reach Zoo Level 8'} ],
    rw:{ gold:3000, xp:2300 } },
  { ch:7, title:'Future Zoo Manager', purpose:'Transition into normal gameplay.',
    obj:[ {t:'level',n:10,label:'Reach Zoo Level 10'}, {t:'owned',n:10,label:'Complete the collection'} ],
    rw:{ gold:6000, xp:3000 } },
];

// ---- VIP service side-quests (separate from new-player quests) -
const VIP_SERVICES = [
  { id:1, title:'Serve a VIP guest',  obj:[{t:'vip',n:1,label:'Serve 1 VIP guest'}],   rw:{ gold:300 } },
  { id:2, title:'VIP Host',           obj:[{t:'vip',n:3,label:'Serve 3 VIP guests'}],  rw:{ gold:700 } },
  { id:3, title:'Five-Star Service',  obj:[{t:'vip',n:6,label:'Serve 6 VIP guests'}],  rw:{ gold:1500 } },
  { id:4, title:'VIP Concierge',      obj:[{t:'vip',n:10,label:'Serve 10 VIP guests'}], rw:{ gold:3000 } },
];

// ---- Entertainment activities (cooldown-based) -------------
// reqSpecies must be owned to run; demo = accelerated cooldown
// (seconds) used in the prototype so timers are observable.
const ENT_CATS = [
  { key:'photo',   name:'Photo Experience',  icon:'📸', cd:'15 min', attr:'petting', lv:1, blurb:'Visitors take photos with friendly animals.' },
  { key:'feeding', name:'Feeding Experience', icon:'🥕', cd:'30 min', attr:'feeding', lv:2, blurb:'Visitors feed animals under supervision.' },
  { key:'riding',  name:'Riding Experience',  icon:'🐎', cd:'1 hr',   attr:'rides',   lv:6, blurb:'Visitors ride suitable animals.' },
  { key:'edu',     name:'Educational',        icon:'🎓', cd:'2 hr',   attr:'shows',   lv:7, blurb:'Animals demonstrate natural behaviours.' },
  { key:'premium', name:'Premium Experience', icon:'⭐', cd:'4 hr',   attr:'perform', lv:8, blurb:'Marquee late-game encounters.' },
];
const ENTERTAINMENT = [
  // Photo · short
  { key:'photo_rabbit', cat:'photo',   name:'Rabbit Photo Session', req:'Rabbit',   gold:120,  rep:3, xp:20, demo:600,  cd:'15 min' },
  { key:'photo_pony',   cat:'photo',   name:'Pony Photo Session',   req:'Horse',    gold:180,  rep:4, xp:24, demo:600,  cd:'15 min' },
  { key:'photo_monkey', cat:'photo',   name:'Monkey Photo Session', req:'Monkey',   gold:240,  rep:5, xp:30, demo:600,  cd:'15 min' },
  // 'Panda Photo Session' (req:'Panda') removed — no Panda in ANIMALS roster (add Panda to restore)
  // Feeding · short
  { key:'feed_rabbit',  cat:'feeding', name:'Rabbit Feeding',       req:'Rabbit',   gold:90,   rep:2, happy:6, demo:1800, cd:'30 min' },
  { key:'feed_goat',    cat:'feeding', name:'Goat Feeding',         req:'Goat',     gold:160,  rep:3, happy:6, demo:1800, cd:'30 min' },
  { key:'feed_giraffe', cat:'feeding', name:'Giraffe Feeding',      req:'Giraffe',  gold:520,  rep:7, happy:8, demo:1800, cd:'30 min' },
  { key:'feed_elephant',cat:'feeding', name:'Elephant Feeding',     req:'Elephant', gold:760,  rep:9, happy:8, demo:1800, cd:'30 min' },
  // Riding · medium
  { key:'ride_horse',   cat:'riding',  name:'Horse Riding',         req:'Horse',    gold:360,  rep:7,  demo:3600, cd:'1 hr' },
  { key:'ride_donkey',  cat:'riding',  name:'Donkey Riding',        req:'Donkey',   gold:300,  rep:6,  demo:3600, cd:'1 hr' },
  { key:'ride_elephant',cat:'riding',  name:'Elephant Riding',      req:'Elephant', gold:980,  rep:12, demo:3600, cd:'1 hr' },
  // Educational · medium · watchable
  { key:'edu_monkey',   cat:'edu',     name:'Monkey Intelligence Demo', req:'Monkey',  rep:10, xp:120, gold:300, demo:7200, cd:'2 hr', watch:true },
  { key:'edu_elephant', cat:'edu',     name:'Elephant Memory Session',  req:'Elephant',rep:14, xp:180, gold:520, demo:7200, cd:'2 hr', watch:true },
  { key:'edu_dolphin',  cat:'edu',     name:'Dolphin Learning Session', req:'Dolphin', rep:18, xp:240, gold:800, demo:7200, cd:'2 hr', watch:true },
  // Premium · long · watchable
  { key:'prem_dolphin', cat:'premium', name:'Dolphin Encounter',    req:'Dolphin',  gold:2200, rep:25, demo:14400, cd:'4 hr', watch:true },
  { key:'prem_sealion', cat:'premium', name:'Sea Lion Interaction', req:'Sea Lion', gold:1800, rep:22, demo:14400, cd:'4 hr', watch:true },
  { key:'prem_safari',  cat:'premium', name:'VIP Safari Tour',      req:'Lion',     gold:2600, rep:30, demo:14400, cd:'4 hr', watch:true },
];

// ---- Localized DATA names (species / taming / habitat / tier) ----------------
// Display-only translations. Helpers fall back to the English data field for EN
// (or any unmapped key). NEVER use these for logic — comparisons against
// ANIMALS[].species / .taming / .habitat must keep the English values.
const SPECIES_VI = {
  rabbit:'Thỏ', chicken:'Gà', duck:'Vịt', dog:'Chó', cat:'Mèo', goat:'Dê', sheep:'Cừu',
  horse:'Ngựa', donkey:'Lừa', alpaca:'Lạc đà Alpaca', cow:'Bò', fox:'Cáo', monkey:'Khỉ',
  raccoon:'Gấu mèo', wolf:'Sói', zebra:'Ngựa vằn', giraffe:'Hươu cao cổ', rhino:'Tê giác',
  hippo:'Hà mã', lion:'Sư tử', elephant:'Voi', brownbear:'Gấu nâu', polarbear:'Gấu Bắc Cực',
  turtle:'Rùa', python:'Trăn', croc:'Cá sấu', seal:'Hải cẩu', sealion:'Sư tử biển', dolphin:'Cá heo',
};
const TAMING_VI = { 'Very Easy':'Rất dễ', 'Easy':'Dễ', 'Medium':'Trung bình', 'Hard':'Khó', 'Expert':'Chuyên gia', 'Master':'Bậc thầy' };
const HABITAT_VI = { meadow:'Đồng cỏ', pasture:'Bãi chăn', woodland:'Rừng thưa', savanna:'Thảo nguyên Savanna', polar:'Đỉnh băng', reptile:'Nhà bò sát', marine:'Vịnh biển' };
const TIER_VI = { 0:'Khởi đầu', 1:'Bậc 1', 2:'Bậc 2', 3:'Bậc 3', 4:'Bậc 4', 5:'Bậc 5', 6:'Bậc 6', 7:'Bậc 7' };
const _vi = ()=> (typeof window!=='undefined' && window.__lang==='vi');
function speciesName(key){ const a = ANIMALS.find(x=>x.key===key); const en = a ? a.species : key; return (_vi() && SPECIES_VI[key]) ? SPECIES_VI[key] : en; }
function tamingName(label){ return (_vi() && TAMING_VI[label]) ? TAMING_VI[label] : label; }
function habitatName(key){ const h = HABITATS.find(x=>x.key===key); const en = h ? h.name : key; return (_vi() && HABITAT_VI[key]) ? HABITAT_VI[key] : en; }
function tierName(t0){ const e = TIERS.find(x=>x.t===t0); const en = e ? e.name : ('Tier '+t0); return (_vi() && TIER_VI[t0]) ? TIER_VI[t0] : en; }
// attraction + activity-category names/desc (data content shown on the Attract/Activities screens)
const ATTR_VI = {
  petting: { name:'Khu vuốt ve',          effect:'+12% khách',     desc:'Khách tương tác với thú Rất dễ / Dễ thuần. Cần Tin tưởng ≥ 40.' },
  feeding: { name:'Khu cho ăn',           effect:'+12% doanh thu', desc:'Khách mua thức ăn để cho thú đã chọn ăn — nguồn vàng đều đặn.' },
  shows:   { name:'Biểu diễn giáo dục',   effect:'+12% doanh thu', desc:'Thú trình diễn tập tính tự nhiên theo lịch định sẵn.' },
  rides:   { name:'Cưỡi thú',             effect:'+12% doanh thu', desc:'Cưỡi ngựa · lừa · voi. Vé cao cấp.' },
  perform: { name:'Đấu trường biểu diễn', effect:'+12% doanh thu', desc:'Thú được huấn luyện, tin tưởng cao biểu diễn các màn. Tiện ích đỉnh cao.' },
};
const ENTCAT_VI = { photo:'Trải nghiệm chụp ảnh', feeding:'Trải nghiệm cho ăn', riding:'Trải nghiệm cưỡi thú', edu:'Giáo dục', premium:'Trải nghiệm cao cấp' };
// entertainment activity names (Activities tab + activity-stage completion), keyed by ENTERTAINMENT[].key
const ENT_VI = {
  photo_rabbit:'Chụp ảnh cùng Thỏ', photo_pony:'Chụp ảnh cùng Ngựa', photo_monkey:'Chụp ảnh cùng Khỉ',
  feed_rabbit:'Cho Thỏ ăn', feed_goat:'Cho Dê ăn', feed_giraffe:'Cho Hươu cao cổ ăn', feed_elephant:'Cho Voi ăn',
  ride_horse:'Cưỡi Ngựa', ride_donkey:'Cưỡi Lừa', ride_elephant:'Cưỡi Voi',
  edu_monkey:'Trình diễn trí thông minh của Khỉ', edu_elephant:'Buổi trình diễn trí nhớ của Voi', edu_dolphin:'Buổi học cùng Cá heo',
  prem_dolphin:'Gặp gỡ Cá heo', prem_sealion:'Giao lưu cùng Sư tử biển', prem_safari:'Tour Safari VIP',
};
// shop limited offers (Shop tab), keyed by the English OFFERS[].name (stable id; name is never used in logic)
const OFFERS_VI = {
  'Starter Decor Bundle': { name:'Gói Trang Trí Khởi Đầu', contents:'Chủ đề Đồng cỏ cao cấp + 400💎', tag:'Một lần · Tuần đầu' },
  'Event Pass':           { name:'Vé Sự Kiện',            contents:'Lộ trình sự kiện cao cấp + skin thú trang trí', tag:'Mỗi sự kiện' },
  'VIP Membership':       { name:'Thành Viên VIP',        contents:'Giới hạn nghỉ 24h, x2 ngọc mỗi ngày, không quảng cáo, trang trí VIP', tag:'Đăng ký' },
  'Habitat Theme Pack':   { name:'Gói Chủ Đề Môi Trường', contents:'Đổi giao diện môi trường độc quyền (trang trí)', tag:'Trang trí' },
};
function attractionName(key){ const a=ATTRACTIONS.find(x=>x.key===key); const en=a?a.name:key; return (_vi()&&ATTR_VI[key])?ATTR_VI[key].name:en; }
function attractionEffect(key){ const a=ATTRACTIONS.find(x=>x.key===key); const en=a?a.effect:''; return (_vi()&&ATTR_VI[key])?ATTR_VI[key].effect:en; }
function attractionDesc(key){ const a=ATTRACTIONS.find(x=>x.key===key); const en=a?a.desc:''; return (_vi()&&ATTR_VI[key])?ATTR_VI[key].desc:en; }
function entCatName(key){ const c=ENT_CATS.find(x=>x.key===key); const en=c?c.name:key; return (_vi()&&ENTCAT_VI[key])?ENTCAT_VI[key]:en; }
function entName(key){ const e=ENTERTAINMENT.find(x=>x.key===key); const en=e?e.name:key; return (_vi()&&ENT_VI[key])?ENT_VI[key]:en; }
function offerName(name){ return (_vi()&&OFFERS_VI[name])?OFFERS_VI[name].name:name; }
function offerContents(name){ const o=OFFERS.find(x=>x.name===name); const en=o?o.contents:''; return (_vi()&&OFFERS_VI[name])?OFFERS_VI[name].contents:en; }
function offerTag(name){ const o=OFFERS.find(x=>x.name===name); const en=o?o.tag:''; return (_vi()&&OFFERS_VI[name])?OFFERS_VI[name].tag:en; }

Object.assign(window, {
  STATS, ACTIONS, TAMING, ANIMALS, TIERS, HABITATS, HAB_UPGRADE, ATTRACTIONS, PERF_SKILLS, PERFORMERS,
  CURRENCIES, SOURCES, SINKS, LEVELS, IDLE, FUNNEL, ACTIVITIES, EVENTS, CADENCE, IAP, OFFERS, KPI,
  TUTORIAL, PLAN90, ROADMAP, ENDGAME, TECH, MVP, DT_ANIMALS, DT_HAB, ENT_CATS, ENTERTAINMENT, ENC_COUNTS, MAX_LEVEL, LEVEL_XP, UNLOCKS, QUESTS, VIP_SERVICES,
  MAX_ENCLOSURE_LEVEL, MAX_ENRICH_LEVEL, TRUST_PETTING, TRUST_PERFORM,
  I18N, t, loadSettings, saveSettings,
  SPECIES_VI, TAMING_VI, HABITAT_VI, TIER_VI, speciesName, tamingName, habitatName, tierName,
  ATTR_VI, ENTCAT_VI, attractionName, attractionEffect, attractionDesc, entCatName,
  ENT_VI, OFFERS_VI, entName, offerName, offerContents, offerTag,
});
