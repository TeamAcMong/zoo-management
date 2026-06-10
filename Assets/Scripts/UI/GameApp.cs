using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using AWZ.Domain;
using AWZ.Runtime;

namespace AWZ.UI
{
    /// <summary>
    /// Runtime UI entry point for Animal World Zoo. Builds the full domain (identical
    /// starter state as <see cref="DevHarness"/>) and renders the game UI with UI Toolkit.
    ///
    /// Spawned automatically by <see cref="GameAppBootstrap"/> via
    /// <c>[RuntimeInitializeOnLoadMethod]</c> — no scene wiring required.
    /// </summary>
    public sealed class GameApp : MonoBehaviour
    {
        // ── Domain services ─────────────────────────────────────────────────
        private GameState           _state;
        private EventBus            _bus;
        private ICurrencyService    _currency;
        private ILevelService       _level;
        private IEconomyService     _economy;
        private ICareService        _care;
        private IHabitatService     _habitat;
        private IEnrichmentService  _enrichment;
        private IAttractionService  _attractions;
        private CollectionService   _collection;

        // ── Tick bookkeeping ────────────────────────────────────────────────
        private float _tickAccum;
        private float _refreshAccum;
        private const float RefreshInterval = 0.25f; // UI refresh cadence in seconds

        // ── Tab system ───────────────────────────────────────────────────────
        private enum Tab { Zoo, Animals, Attract, Activities, Shop }
        private Tab _activeTab = Tab.Zoo;

        // Five nav buttons kept for highlight repaint
        private readonly Button[] _navButtons = new Button[5];

        // ── UI refs ─────────────────────────────────────────────────────────
        private UIDocument    _document;
        private VisualElement _root;
        private VisualElement _hudBar;
        private ScrollView    _bodyScroll;   // single shared content area

        // HUD labels (cached to avoid per-frame Q<>)
        private Label         _lblGold;
        private Label         _lblGems;
        private Label         _lblLevel;
        private Label         _lblXp;
        private Label         _lblGps;
        private Label         _lblCap;
        private Label         _lblHappy;
        private VisualElement _xpBar;

        // ── Texture cache (loaded once in BuildUI) ───────────────────────────
        private readonly Dictionary<string, Texture2D> _texCache = new Dictionary<string, Texture2D>();

        // ── Activities cooldown tracking ─────────────────────────────────────
        private readonly Dictionary<string, float> _activityLastUsed = new Dictionary<string, float>();

        // ── Shop one-per-session daily gift ──────────────────────────────────
        private bool _dailyGiftClaimed;

        // Theme colours (light / warm palette) ──────────────────────────────
        private static readonly Color ColBg          = new Color(0.984f, 0.953f, 0.902f, 1f);   // #FBF3E6
        private static readonly Color ColCardBg      = new Color(1.000f, 1.000f, 1.000f, 1f);   // white
        private static readonly Color ColCardBorder  = new Color(0.859f, 0.906f, 0.843f, 1f);   // soft green tint border
        private static readonly Color ColAdoptRow    = new Color(0.973f, 0.988f, 0.969f, 1f);   // very pale green
        private static readonly Color ColHudPill     = new Color(1.000f, 1.000f, 1.000f, 1f);   // white pill
        private static readonly Color ColHudBg       = new Color(0.976f, 0.941f, 0.886f, 1f);   // warm cream hud area
        private static readonly Color ColTextDark    = new Color(0.165f, 0.165f, 0.200f, 1f);   // #2A2A33
        private static readonly Color ColTextMid     = new Color(0.380f, 0.380f, 0.420f, 1f);   // medium gray
        private static readonly Color ColTextLight   = new Color(0.600f, 0.600f, 0.640f, 1f);   // light gray label
        private static readonly Color ColTextGreen   = new Color(0.200f, 0.560f, 0.200f, 1f);   // appeal / unlock green
        private static readonly Color ColXpTrack     = new Color(0.875f, 0.855f, 0.820f, 1f);   // warm gray track
        private static readonly Color ColXpFill      = new Color(0.400f, 0.741f, 0.988f, 1f);   // sky blue
        private static readonly Color ColCareBg      = new Color(0.216f, 0.718f, 0.420f, 1f);   // green care btn
        private static readonly Color ColCareText    = new Color(1.000f, 1.000f, 1.000f, 1f);
        private static readonly Color ColEconBg      = new Color(0.949f, 0.698f, 0.157f, 1f);   // gold econ btn
        private static readonly Color ColEconText    = new Color(0.165f, 0.165f, 0.200f, 1f);
        private static readonly Color ColDevBg       = new Color(0.878f, 0.878f, 0.878f, 1f);   // muted gray dev
        private static readonly Color ColDevText     = new Color(0.420f, 0.420f, 0.420f, 1f);
        private static readonly Color ColNavBg       = new Color(1.000f, 1.000f, 1.000f, 1f);   // white nav bar
        private static readonly Color ColNavBorder   = new Color(0.878f, 0.878f, 0.878f, 1f);
        private static readonly Color ColNavActive   = new Color(0.216f, 0.718f, 0.420f, 1f);   // green active tab
        private static readonly Color ColNavInactive = new Color(0.600f, 0.600f, 0.640f, 1f);
        private static readonly Color ColSectionChip = new Color(0.216f, 0.718f, 0.420f, 0.15f);// very pale chip bg
        private static readonly Color ColSectionText = new Color(0.165f, 0.420f, 0.220f, 1f);   // deep green text
        private static readonly Color ColLockText    = new Color(0.600f, 0.600f, 0.640f, 1f);
        private static readonly Color ColMaxText     = new Color(0.200f, 0.560f, 0.200f, 1f);
        private static readonly Color ColBarHunger   = new Color(0.988f, 0.600f, 0.180f, 1f);
        private static readonly Color ColBarThirst   = new Color(0.220f, 0.620f, 0.980f, 1f);
        private static readonly Color ColBarClean    = new Color(0.260f, 0.800f, 0.400f, 1f);
        private static readonly Color ColBarHappy    = new Color(0.988f, 0.357f, 0.600f, 1f);
        private static readonly Color ColBarTrack    = new Color(0.878f, 0.878f, 0.878f, 1f);

        // ── Lifecycle ────────────────────────────────────────────────────────
        private void Awake()
        {
            BuildDomain();
            LoadTextureCache();
            BuildUI();
        }

        private void Update()
        {
            if (_state == null) return;

            float dt = Time.deltaTime;
            _care.Decay(dt);

            _tickAccum += dt;
            while (_tickAccum >= 1f)
            {
                _tickAccum -= 1f;
                _currency.Grant(CurrencyType.Gold, _economy.GoldPerSec());
            }

            _refreshAccum += dt;
            if (_refreshAccum >= RefreshInterval)
            {
                _refreshAccum = 0f;
                RefreshUI();
            }
        }

        // ── Domain construction (mirrors DevHarness exactly) ─────────────────
        private void BuildDomain()
        {
            _state = new GameState
            {
                Gold         = 200,
                Gems         = 10,
                OwnedSpecies = new[] { "rabbit" },
                ClosedAtUtc  = DateTime.UtcNow,
            };
            _state.AnimalCounts["rabbit"] = 1;
            _state.AnimalMeters["rabbit"] = new AnimalMeters();

            _bus         = new EventBus();
            _currency    = new CurrencyService(_state);
            _level       = new LevelService(_state, _bus);
            _attractions = new AttractionService(_state);
            _habitat     = new HabitatService(_state, _currency, DefaultAnimalData.AppealOf);
            _enrichment  = new EnrichmentService(_state, _currency, DefaultAnimalData.AppealOf);
            _economy     = new EconomyService(_state, _habitat, _enrichment, _attractions, DefaultAnimalData.AppealOf);
            _care        = new CareService(_state, _level, _bus);
            _collection  = new CollectionService(_state, _currency, _level,
                               DefaultAnimalData.AppealOf, DefaultAnimalData.UnlockLevelOf);

            Debug.Log("[GameApp] Domain built. UI Toolkit runtime UI active.");
        }

        private void Reset() => BuildDomain();

        // ── Cost formulas (display only — mirror service formulas) ────────────
        private long BuyCost(string key)
        {
            int count = _state.AnimalCounts.TryGetValue(key, out int c) ? c : 0;
            return (long)Math.Round(DefaultAnimalData.AppealOf(key) * 50 * count) + 50;
        }

        private long UpgradeCost(string key)
            => (long)Math.Round(DefaultAnimalData.AppealOf(key) * 80 * _habitat.EnclosureLevel(key)) + 300;

        private long EnrichCost(string key)
            => (long)Math.Round(DefaultAnimalData.AppealOf(key) * 20 * (_enrichment.EnrichmentLevel(key) + 1)) + 200;

        // ── Texture loading (once, at startup) ──────────────────────────────
        private void LoadTextureCache()
        {
            // Animal sprites
            string[] animalKeys = { "rabbit", "chicken", "goat", "sheep", "pig",
                                    "deer", "penguin", "monkey", "zebra", "giraffe",
                                    "lion", "elephant" };
            foreach (string k in animalKeys)
            {
                var tex = Resources.Load<Texture2D>($"Art/Animals/{k}");
                if (tex != null)
                    _texCache[$"animal:{k}"] = tex;
                else
                    Debug.LogWarning($"[GameApp] Missing animal texture: Art/Animals/{k}");
            }

            // UI icon sprites
            string[] iconNames = { "coin", "gem", "star", "feed", "water", "clean", "pet" };
            foreach (string n in iconNames)
            {
                var tex = Resources.Load<Texture2D>($"Art/UI/{n}");
                if (tex != null)
                    _texCache[$"icon:{n}"] = tex;
                else
                    Debug.LogWarning($"[GameApp] Missing UI icon texture: Art/UI/{n}");
            }

            // Decor sprites for the zoo map (pond.png intentionally skipped — drawn as VisualElement)
            string[] decorKeys = { "tree", "evergreen", "palm", "grass", "flower", "visitor", "bench" };
            foreach (string d in decorKeys)
            {
                var tex = Resources.Load<Texture2D>($"Art/Decor/{d}");
                if (tex != null)
                    _texCache[$"decor:{d}"] = tex;
                else
                    Debug.LogWarning($"[GameApp] Missing decor texture: Art/Decor/{d}");
            }

            // Zoo map background (Ludo art) — drawn behind the pens on the Zoo tab.
            var mapTex = Resources.Load<Texture2D>("Art/UI/zoomap");
            if (mapTex != null)
                _texCache["map"] = mapTex;
            else
                Debug.LogWarning("[GameApp] Missing map texture: Art/UI/zoomap");

            // Idle animation spritesheets (4x4, 16 frames) for the map enclosures.
            // Optional — a species without a sheet simply renders its static face icon.
            foreach (string k in animalKeys)
            {
                var sheet = Resources.Load<Texture2D>($"Art/AnimalsAnim/{k}");
                if (sheet != null)
                    _texCache[$"anim:{k}"] = sheet;
            }
        }

        /// <summary>Returns a cached texture or null. Never calls Resources.Load after Awake.</summary>
        private Texture2D GetTex(string cacheKey)
        {
            _texCache.TryGetValue(cacheKey, out var t);
            return t;
        }

        /// <summary>
        /// Creates an Image that frame-cycles an animal's 4x4 idle spritesheet via sourceRect
        /// (~11 fps loop). Falls back to the static face sprite when no animation sheet exists.
        /// </summary>
        private Image MakeAnimatedAnimal(string speciesKey, float size)
        {
            var sheet = GetTex($"anim:{speciesKey}");
            if (sheet == null) return MakeSprite($"animal:{speciesKey}", size);

            const int cols = 4, rows = 4, total = 16;
            float fw = sheet.width  / (float)cols;
            float fh = sheet.height / (float)rows;

            var img = new Image();
            img.style.width      = size;
            img.style.height     = size;
            img.style.flexShrink = 0;
            img.scaleMode        = ScaleMode.ScaleToFit;
            img.image            = sheet;
            img.sourceRect       = new Rect(0f, 0f, fw, fh);

            int frame = 0;
            img.schedule.Execute(() =>
            {
                frame = (frame + 1) % total;
                int col = frame % cols;
                int row = frame / cols;
                img.sourceRect = new Rect(col * fw, row * fh, fw, fh);
            }).Every(90);

            return img;
        }

        /// <summary>
        /// Creates an Image VisualElement from the cache. Returns a plain Image
        /// (same size, no image) when the texture is missing so layout holds.
        /// </summary>
        private Image MakeSprite(string cacheKey, float size)
        {
            var img = new Image();
            img.style.width      = size;
            img.style.height     = size;
            img.style.flexShrink = 0;
            img.scaleMode        = ScaleMode.ScaleToFit;
            var tex = GetTex(cacheKey);
            if (tex != null)
                img.image = tex;
            return img;
        }

        // ── UI construction ──────────────────────────────────────────────────
        private void BuildUI()
        {
            var go = gameObject;

            _document = go.AddComponent<UIDocument>();

            PanelSettings panel = ScriptableObject.CreateInstance<PanelSettings>();
            panel.name = "AWZ_RuntimePanelSettings";

            var theme = Resources.Load<ThemeStyleSheet>("UI/DefaultRuntimeTheme");
            if (theme != null)
            {
                panel.themeStyleSheet = theme;
                Debug.Log("[GameApp] Runtime theme loaded from Resources.");
            }
            else
            {
                Debug.LogWarning("[GameApp] DefaultRuntimeTheme.tss not found in Resources/UI/. " +
                                 "Text will use fallback font.");
            }

            panel.scaleMode           = PanelScaleMode.ScaleWithScreenSize;
            panel.referenceResolution = new Vector2Int(1080, 1920);
            panel.sortingOrder        = 0;

            _document.panelSettings = panel;

            _root = _document.rootVisualElement;
            ApplyFallbackFont(_root);

            _root.style.flexDirection   = FlexDirection.Column;
            _root.style.backgroundColor = ColBg;
            _root.style.width           = new StyleLength(new Length(100f, LengthUnit.Percent));
            _root.style.height          = new StyleLength(new Length(100f, LengthUnit.Percent));

            // Safe area: inset the whole UI away from the iPhone notch / Dynamic Island,
            // Android display cutouts, and the home indicator. Recomputed on every layout.
            _root.RegisterCallback<GeometryChangedEvent>(_ => ApplySafeArea());

            BuildHud();
            BuildBodyScroll();
            BuildNavBar();

            // Render the default landing tab
            RebuildCurrentTab();
            RefreshHud();
        }

        /// <summary>Sets a fallback system font on the root so labels render even if the theme TSS fails.</summary>
        private static void ApplyFallbackFont(VisualElement root)
        {
            Font fallback = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (fallback == null)
                fallback = Font.CreateDynamicFontFromOSFont("Arial", 14);

            if (fallback != null)
                root.style.unityFontDefinition = FontDefinition.FromFont(fallback);
        }

        /// <summary>
        /// Insets the root so no UI sits under the notch / Dynamic Island / rounded corners /
        /// home indicator. Maps <see cref="Screen.safeArea"/> (physical px, bottom-left origin)
        /// onto the panel's logical size, so it is correct regardless of PanelSettings scale mode.
        /// Invoked on every layout change (GeometryChangedEvent). On a device with no cutout the
        /// safe area equals the full screen, so all paddings resolve to 0 (no wasted space).
        /// </summary>
        private void ApplySafeArea()
        {
            if (_root == null) return;

            float rootW = _root.resolvedStyle.width;
            float rootH = _root.resolvedStyle.height;
            if (rootW <= 1f || rootH <= 1f) return; // layout not ready yet

            float sw = Screen.width;
            float sh = Screen.height;
            if (sw <= 0f || sh <= 0f) return;

            Rect safe = Screen.safeArea; // bottom-left origin, physical pixels

            float top    = (sh - safe.yMax) / sh * rootH; // notch / status bar
            float bottom = (safe.yMin)      / sh * rootH; // home indicator
            float left   = (safe.xMin)      / sw * rootW; // left cutout (landscape)
            float right  = (sw - safe.xMax) / sw * rootW; // right cutout

            _root.style.paddingTop    = Mathf.Max(0f, top);
            _root.style.paddingBottom = Mathf.Max(0f, bottom);
            _root.style.paddingLeft   = Mathf.Max(0f, left);
            _root.style.paddingRight  = Mathf.Max(0f, right);
        }

        // ── HUD bar ──────────────────────────────────────────────────────────
        private void BuildHud()
        {
            _hudBar = new VisualElement();
            _hudBar.style.backgroundColor = ColHudBg;
            _hudBar.style.flexDirection   = FlexDirection.Column;
            _hudBar.style.paddingLeft     = 14;
            _hudBar.style.paddingRight    = 14;
            _hudBar.style.paddingTop      = 12;
            _hudBar.style.paddingBottom   = 8;

            var pillRow = new VisualElement();
            pillRow.style.flexDirection  = FlexDirection.Row;
            pillRow.style.alignItems     = Align.Center;
            pillRow.style.justifyContent = Justify.SpaceBetween;

            var goldPill = MakeHudPill();
            goldPill.Add(MakeSprite("icon:coin", 24f));
            goldPill.Add(MakePillValueColumn(out _lblGold, "GOLD"));

            var gemPill = MakeHudPill();
            gemPill.Add(MakeSprite("icon:gem", 24f));
            gemPill.Add(MakePillValueColumn(out _lblGems, "GEMS"));

            var lvlPill = MakeHudPill();
            lvlPill.Add(MakeSprite("icon:star", 24f));
            lvlPill.Add(MakePillValueColumn(out _lblLevel, "ZOO"));

            pillRow.Add(goldPill);
            pillRow.Add(gemPill);
            pillRow.Add(lvlPill);
            _hudBar.Add(pillRow);

            var statsRow = new VisualElement();
            statsRow.style.flexDirection  = FlexDirection.Row;
            statsRow.style.alignItems     = Align.Center;
            statsRow.style.marginTop      = 6;
            statsRow.style.justifyContent = Justify.SpaceBetween;

            _lblGps   = MakeStatLabel("0 g/s");
            _lblCap   = MakeStatLabel("Cap: 0");
            _lblHappy = MakeStatLabel("Happy: 0%");

            statsRow.Add(_lblGps);
            statsRow.Add(_lblCap);
            statsRow.Add(_lblHappy);
            _hudBar.Add(statsRow);

            var xpSection = new VisualElement();
            xpSection.style.marginTop = 8;

            _lblXp = new Label("Lv 1  ·  0 XP  ·  Lv 2");
            _lblXp.style.fontSize       = 10;
            _lblXp.style.color          = ColTextMid;
            _lblXp.style.marginBottom   = 3;
            _lblXp.style.unityTextAlign = TextAnchor.UpperCenter;
            xpSection.Add(_lblXp);

            var xpTrack = new VisualElement();
            xpTrack.style.height                  = 6;
            xpTrack.style.backgroundColor         = ColXpTrack;
            xpTrack.style.borderTopLeftRadius     = 3;
            xpTrack.style.borderTopRightRadius    = 3;
            xpTrack.style.borderBottomLeftRadius  = 3;
            xpTrack.style.borderBottomRightRadius = 3;
            xpTrack.style.overflow                = Overflow.Hidden;

            _xpBar = new VisualElement();
            _xpBar.style.height          = 6;
            _xpBar.style.width           = new StyleLength(new Length(0f, LengthUnit.Percent));
            _xpBar.style.backgroundColor = ColXpFill;
            _xpBar.style.borderTopLeftRadius     = 3;
            _xpBar.style.borderTopRightRadius    = 3;
            _xpBar.style.borderBottomLeftRadius  = 3;
            _xpBar.style.borderBottomRightRadius = 3;
            xpTrack.Add(_xpBar);
            xpSection.Add(xpTrack);
            _hudBar.Add(xpSection);

            _root.Add(_hudBar);
        }

        private static VisualElement MakeHudPill()
        {
            var pill = new VisualElement();
            pill.style.flexDirection           = FlexDirection.Row;
            pill.style.alignItems              = Align.Center;
            pill.style.backgroundColor         = ColHudPill;
            pill.style.borderTopLeftRadius     = 16;
            pill.style.borderTopRightRadius    = 16;
            pill.style.borderBottomLeftRadius  = 16;
            pill.style.borderBottomRightRadius = 16;
            pill.style.paddingLeft             = 10;
            pill.style.paddingRight            = 12;
            pill.style.paddingTop              = 6;
            pill.style.paddingBottom           = 6;
            pill.style.borderTopWidth          = 1;
            pill.style.borderRightWidth        = 1;
            pill.style.borderBottomWidth       = 2;
            pill.style.borderLeftWidth         = 1;
            pill.style.borderTopColor          = new Color(0.878f, 0.878f, 0.878f, 1f);
            pill.style.borderRightColor        = new Color(0.878f, 0.878f, 0.878f, 1f);
            pill.style.borderBottomColor       = new Color(0.780f, 0.780f, 0.780f, 1f);
            pill.style.borderLeftColor         = new Color(0.878f, 0.878f, 0.878f, 1f);
            pill.style.flexGrow                = 1;
            pill.style.flexBasis               = 0;
            pill.style.marginLeft              = 4;
            pill.style.marginRight             = 4;
            return pill;
        }

        private static VisualElement MakePillValueColumn(out Label valueLbl, string subText)
        {
            var col = new VisualElement();
            col.style.flexDirection = FlexDirection.Column;
            col.style.marginLeft    = 6;
            col.style.flexGrow      = 1;

            valueLbl = new Label("0");
            valueLbl.style.fontSize                = 18;
            valueLbl.style.color                   = ColTextDark;
            valueLbl.style.unityFontStyleAndWeight = FontStyle.Bold;

            var subLbl = new Label(subText);
            subLbl.style.fontSize = 9;
            subLbl.style.color    = ColTextLight;

            col.Add(valueLbl);
            col.Add(subLbl);
            return col;
        }

        private static Label MakeStatLabel(string text)
        {
            var lbl = new Label(text);
            lbl.style.fontSize = 11;
            lbl.style.color    = ColTextMid;
            return lbl;
        }

        // ── Shared scrollable body ────────────────────────────────────────────
        private void BuildBodyScroll()
        {
            _bodyScroll = new ScrollView(ScrollViewMode.Vertical);
            _bodyScroll.style.flexGrow      = 1;
            _bodyScroll.style.paddingTop    = 8;
            _bodyScroll.style.paddingBottom = 68; // above nav bar
            _root.Add(_bodyScroll);
        }

        // ── Bottom navigation bar ────────────────────────────────────────────
        private void BuildNavBar()
        {
            var nav = new VisualElement();
            nav.style.flexDirection   = FlexDirection.Row;
            nav.style.alignItems      = Align.Stretch;
            nav.style.backgroundColor = ColNavBg;
            nav.style.borderTopWidth  = 1;
            nav.style.borderTopColor  = ColNavBorder;
            nav.style.height          = 60;
            nav.style.flexShrink      = 0;

            // Tab definitions aligned to Tab enum order
            var defs = new (string Label, string IconKey)[]
            {
                ("Zoo",        "icon:star"),
                ("Animals",    "icon:pet"),
                ("Attract",    "icon:coin"),
                ("Activities", "icon:feed"),
                ("Shop",       "icon:gem"),
            };

            for (int i = 0; i < defs.Length; i++)
            {
                int capturedIndex = i; // capture for closure
                Tab capturedTab   = (Tab)i;

                var btn = MakeNavButton(defs[i].Label, defs[i].IconKey, capturedTab == _activeTab);
                btn.clicked += () => SwitchTab(capturedTab);

                _navButtons[capturedIndex] = btn;
                nav.Add(btn);
            }

            _root.Add(nav);
        }

        /// <summary>
        /// Builds a nav tab as a Button. Using Button.clicked (confirmed in Unity 6 UI Toolkit
        /// reference) is the simplest reliable way to handle tap/click on a nav item.
        /// </summary>
        private Button MakeNavButton(string label, string iconKey, bool active)
        {
            // Button with no default text — we manage children manually
            var btn = new Button();
            btn.text = string.Empty;

            // Remove default Button padding/margin imposed by the runtime theme so our
            // custom layout takes effect. We also strip the border so it looks like a tab.
            btn.style.flexGrow         = 1;
            btn.style.flexDirection    = FlexDirection.Column;
            btn.style.alignItems       = Align.Center;
            btn.style.justifyContent   = Justify.Center;
            btn.style.paddingTop       = 6;
            btn.style.paddingBottom    = 4;
            btn.style.paddingLeft      = 0;
            btn.style.paddingRight     = 0;
            btn.style.marginTop        = 0;
            btn.style.marginBottom     = 0;
            btn.style.marginLeft       = 0;
            btn.style.marginRight      = 0;
            btn.style.backgroundColor  = active ? new Color(0.216f, 0.718f, 0.420f, 0.08f) : Color.clear;
            btn.style.borderTopWidth   = 0;
            btn.style.borderRightWidth = 0;
            btn.style.borderBottomWidth = 0;
            btn.style.borderLeftWidth  = 0;

            // Icon
            var icon = MakeSprite(iconKey, 22f);
            icon.style.marginBottom = 2;
            if (!active) icon.style.opacity = 0.5f;
            btn.Add(icon);

            // Label
            var lbl = new Label(label);
            lbl.style.fontSize                = 10;
            lbl.style.color                   = active ? ColNavActive : ColNavInactive;
            lbl.style.unityFontStyleAndWeight = active ? FontStyle.Bold : FontStyle.Normal;
            lbl.style.unityTextAlign          = TextAnchor.UpperCenter;
            btn.Add(lbl);

            // Active indicator dot
            if (active)
            {
                var dot = new VisualElement();
                dot.style.width                      = 4;
                dot.style.height                     = 4;
                dot.style.backgroundColor            = ColNavActive;
                dot.style.borderTopLeftRadius        = 2;
                dot.style.borderTopRightRadius       = 2;
                dot.style.borderBottomLeftRadius     = 2;
                dot.style.borderBottomRightRadius    = 2;
                dot.style.marginTop                  = 2;
                btn.Add(dot);
            }

            return btn;
        }

        /// <summary>Switches to the given tab: updates highlight, clears body, rebuilds content.</summary>
        private void SwitchTab(Tab tab)
        {
            _activeTab = tab;
            UpdateNavHighlight();
            RebuildCurrentTab();
        }

        /// <summary>Repaints all five nav buttons to reflect the new active tab.</summary>
        private void UpdateNavHighlight()
        {
            string[] labels    = { "Zoo", "Animals", "Attract", "Activities", "Shop" };
            string[] iconKeys  = { "icon:star", "icon:pet", "icon:coin", "icon:feed", "icon:gem" };

            for (int i = 0; i < _navButtons.Length; i++)
            {
                bool active = (Tab)i == _activeTab;
                var  btn    = _navButtons[i];

                // Rebuild the button's children to repaint icon + label + dot
                btn.Clear();
                btn.style.backgroundColor = active
                    ? new Color(0.216f, 0.718f, 0.420f, 0.08f)
                    : Color.clear;

                var icon = MakeSprite(iconKeys[i], 22f);
                icon.style.marginBottom = 2;
                if (!active) icon.style.opacity = 0.5f;
                btn.Add(icon);

                var lbl = new Label(labels[i]);
                lbl.style.fontSize                = 10;
                lbl.style.color                   = active ? ColNavActive : ColNavInactive;
                lbl.style.unityFontStyleAndWeight = active ? FontStyle.Bold : FontStyle.Normal;
                lbl.style.unityTextAlign          = TextAnchor.UpperCenter;
                btn.Add(lbl);

                if (active)
                {
                    var dot = new VisualElement();
                    dot.style.width                      = 4;
                    dot.style.height                     = 4;
                    dot.style.backgroundColor            = ColNavActive;
                    dot.style.borderTopLeftRadius        = 2;
                    dot.style.borderTopRightRadius       = 2;
                    dot.style.borderBottomLeftRadius     = 2;
                    dot.style.borderBottomRightRadius    = 2;
                    dot.style.marginTop                  = 2;
                    btn.Add(dot);
                }
            }
        }

        // ── Content dispatch ─────────────────────────────────────────────────
        private void RebuildCurrentTab()
        {
            _bodyScroll.Clear();
            switch (_activeTab)
            {
                case Tab.Zoo:        BuildZooTab();        break;
                case Tab.Animals:    BuildAnimalsTab();    break;
                case Tab.Attract:    BuildAttractTab();    break;
                case Tab.Activities: BuildActivitiesTab(); break;
                case Tab.Shop:       BuildShopTab();       break;
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // TAB: Zoo  (top-down zoo MAP)
        // ════════════════════════════════════════════════════════════════════

        // Pen slot positions: (leftPercent, topPx) in the 760px-tall map canvas.
        // Three columns at ~8%, ~38%, ~68% from left; rows spaced 125px apart.
        private static readonly (float LeftPct, float TopPx)[] PenSlots =
        {
            (8f,  20f), (38f,  20f), (68f,  20f),
            (8f, 155f), (38f, 155f), (68f, 155f),
            (8f, 290f), (38f, 290f), (68f, 290f),
            (8f, 425f), (38f, 425f), (68f, 425f),
        };

        // Fixed decor placements: (key, leftPct, topPx, sizePx)
        // Chosen to fill gaps between pens and corners of the 760px canvas.
        private static readonly (string Key, float LeftPct, float TopPx, float Size)[] DecorPlacements =
        {
            // Trees / greenery around edges and gaps
            ("tree",      26f,  48f,  40f),
            ("evergreen", 56f,  48f,  36f),
            ("palm",      84f,  60f,  44f),
            ("tree",      26f, 180f,  38f),
            ("grass",     56f, 175f,  32f),
            ("flower",    84f, 190f,  28f),
            ("evergreen", 26f, 315f,  36f),
            ("flower",    56f, 310f,  28f),
            ("tree",      84f, 320f,  40f),
            ("bench",     26f, 450f,  32f),
            ("grass",     84f, 450f,  30f),
            ("palm",      56f, 450f,  38f),
            // Visitors near center
            ("visitor",   44f, 370f,  30f),
            ("visitor",   52f, 360f,  30f),
            ("visitor",   48f, 395f,  28f),
        };

        private static readonly Color ColGround       = new Color(0.561f, 0.788f, 0.478f, 1f); // #8FC97A grass green
        private static readonly Color ColPenBg        = new Color(0.910f, 0.847f, 0.690f, 1f); // #E8D8B0 tan sand
        private static readonly Color ColPenBorder    = new Color(0.698f, 0.584f, 0.380f, 1f); // #B29561 darker sand border
        private static readonly Color ColPond         = new Color(0.494f, 0.784f, 0.890f, 1f); // #7EC8E3 pond blue
        private static readonly Color ColPath         = new Color(0.859f, 0.804f, 0.667f, 1f); // #DBCDAA subtle path

        // Enclosure centres as percent of the Ludo map image (768x1344). Owned animals
        // fill these slots in order. Tuned to the painted pens on zoomap.png.
        private static readonly (float L, float T)[] PenPct =
        {
            (40f,14f), (17f,24f), (31f,28f), (22f,37f),
            (72f,22f), (78f,38f), (18f,55f), (62f,50f),
            (28f,82f), (45f,45f), (72f,62f), (50f,70f),
        };

        private void BuildZooTab()
        {
            // ── Compact stats strip ──────────────────────────────────────────
            long   gps     = _economy.GoldPerSec();
            long   cap     = _economy.Capacity();
            float  happy   = _care.AvgHappiness();
            double totalAppeal = 0;
            foreach (string k in _state.OwnedSpecies)
                totalAppeal += _economy.AppealOf(k);
            long visitors = Math.Min((long)Math.Round(totalAppeal), cap);

            var statsStrip = new VisualElement();
            statsStrip.style.flexDirection   = FlexDirection.Row;
            statsStrip.style.justifyContent  = Justify.SpaceAround;
            statsStrip.style.alignItems      = Align.Center;
            statsStrip.style.backgroundColor = ColCardBg;
            statsStrip.style.borderTopLeftRadius     = 10;
            statsStrip.style.borderTopRightRadius    = 10;
            statsStrip.style.borderBottomLeftRadius  = 10;
            statsStrip.style.borderBottomRightRadius = 10;
            statsStrip.style.borderTopWidth    = 1;
            statsStrip.style.borderRightWidth  = 1;
            statsStrip.style.borderBottomWidth = 2;
            statsStrip.style.borderLeftWidth   = 1;
            statsStrip.style.borderTopColor    = ColCardBorder;
            statsStrip.style.borderRightColor  = ColCardBorder;
            statsStrip.style.borderBottomColor = ColCardBorder;
            statsStrip.style.borderLeftColor   = ColCardBorder;
            statsStrip.style.paddingTop        = 7;
            statsStrip.style.paddingBottom     = 7;
            statsStrip.style.marginLeft        = 10;
            statsStrip.style.marginRight       = 10;
            statsStrip.style.marginBottom      = 8;

            statsStrip.Add(MakeStatsChip($"{gps:n0} g/s", "Gold/sec"));
            statsStrip.Add(MakeStatsChip($"{cap:n0}",     "Capacity"));
            statsStrip.Add(MakeStatsChip($"{visitors:n0}","Visitors"));
            statsStrip.Add(MakeStatsChip($"{happy:0}%",   "Happy"));
            _bodyScroll.Add(statsStrip);

            // ── Map canvas: Ludo top-down zoo art as the background. ──────────
            // Height is corrected on layout to preserve the 768x1344 image aspect so the
            // percent-positioned pens land exactly on the painted enclosures.
            var mapCanvas = new VisualElement();
            mapCanvas.style.position    = Position.Relative;
            mapCanvas.style.width       = new StyleLength(new Length(100f, LengthUnit.Percent));
            mapCanvas.style.height      = 600; // provisional; set precisely in the layout callback
            mapCanvas.style.marginLeft  = 6;
            mapCanvas.style.marginRight = 6;
            mapCanvas.style.marginBottom = 8;
            mapCanvas.style.overflow    = Overflow.Visible;

            var mapTex = GetTex("map");
            if (mapTex != null)
            {
                mapCanvas.style.backgroundImage          = new StyleBackground(mapTex);
                mapCanvas.style.unityBackgroundScaleMode = ScaleMode.ScaleToFit;
            }
            else
            {
                mapCanvas.style.backgroundColor = ColGround;
            }

            const float MapAspect = 1344f / 768f; // portrait map ratio
            mapCanvas.RegisterCallback<GeometryChangedEvent>(_ =>
            {
                float w = mapCanvas.resolvedStyle.width;
                if (w <= 1f) return;
                float target = w * MapAspect;
                if (Mathf.Abs(mapCanvas.resolvedStyle.height - target) > 1f)
                    mapCanvas.style.height = target;
            });

            // ── Animals on their painted enclosures (percent of the map image) ──
            int slotIdx = 0;
            foreach (string speciesKey in _state.OwnedSpecies)
            {
                if (slotIdx >= PenPct.Length) break;
                var (leftPct, topPct) = PenPct[slotIdx++];
                mapCanvas.Add(MakePenOnMap(speciesKey, leftPct, topPct));
            }

            _bodyScroll.Add(mapCanvas);

            // ── Hint label under the map ─────────────────────────────────────
            var hint = new Label("Tap Animals to care · Attract to build attractions");
            hint.style.fontSize       = 12;
            hint.style.color          = ColTextLight;
            hint.style.unityTextAlign = TextAnchor.UpperCenter;
            hint.style.marginTop      = 10;
            hint.style.marginBottom   = 16;
            hint.style.marginLeft     = 20;
            hint.style.marginRight    = 20;
            hint.style.whiteSpace     = WhiteSpace.Normal;
            _bodyScroll.Add(hint);
        }

        /// <summary>
        /// Places an owned animal on the Ludo map at (leftPct, topPct) of the image, centred on
        /// that point. Transparent sprite + a small name pill. Tap routes to the Animals tab.
        /// </summary>
        private VisualElement MakePenOnMap(string speciesKey, float leftPct, float topPct)
        {
            int    count = _state.AnimalCounts.TryGetValue(speciesKey, out int c) ? c : 0;
            string name  = DefaultAnimalData.NameOf(speciesKey);

            var holder = new VisualElement();
            holder.style.position   = Position.Absolute;
            holder.style.left       = new StyleLength(new Length(leftPct, LengthUnit.Percent));
            holder.style.top        = new StyleLength(new Length(topPct,  LengthUnit.Percent));
            holder.style.translate  = new StyleTranslate(new Translate(Length.Percent(-50f), Length.Percent(-50f)));
            holder.style.alignItems = Align.Center;
            holder.style.overflow   = Overflow.Visible;

            var sprite = MakeAnimatedAnimal(speciesKey, 92f);
            holder.Add(sprite);

            var nameLbl = new Label(count > 1 ? $"{name}  x{count}" : name);
            nameLbl.style.fontSize                = 11;
            nameLbl.style.color                   = ColTextDark;
            nameLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            nameLbl.style.unityTextAlign          = TextAnchor.UpperCenter;
            nameLbl.style.backgroundColor         = new Color(0.965f, 0.945f, 0.886f, 0.92f);
            nameLbl.style.paddingLeft             = 7;
            nameLbl.style.paddingRight            = 7;
            nameLbl.style.paddingTop              = 1;
            nameLbl.style.paddingBottom           = 1;
            nameLbl.style.marginTop               = -8;
            nameLbl.style.borderTopLeftRadius     = 8;
            nameLbl.style.borderTopRightRadius    = 8;
            nameLbl.style.borderBottomLeftRadius  = 8;
            nameLbl.style.borderBottomRightRadius = 8;
            holder.Add(nameLbl);

            holder.RegisterCallback<PointerDownEvent>(_ => SwitchTab(Tab.Animals));
            return holder;
        }

        /// <summary>
        /// Creates one stats chip (value + sub-label) for the compact stats strip.
        /// </summary>
        private static VisualElement MakeStatsChip(string value, string subLabel)
        {
            var col = new VisualElement();
            col.style.flexDirection  = FlexDirection.Column;
            col.style.alignItems     = Align.Center;

            var valLbl = new Label(value);
            valLbl.style.fontSize                = 14;
            valLbl.style.color                   = ColTextDark;
            valLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            valLbl.style.unityTextAlign          = TextAnchor.UpperCenter;
            col.Add(valLbl);

            var subLbl = new Label(subLabel);
            subLbl.style.fontSize       = 9;
            subLbl.style.color          = ColTextLight;
            subLbl.style.unityTextAlign = TextAnchor.UpperCenter;
            col.Add(subLbl);

            return col;
        }

        /// <summary>
        /// Creates an animal enclosure pen at absolute (leftPct%, topPx) inside the map canvas.
        /// Overflow is Visible and the sprite has top headroom so ears are never clipped.
        /// </summary>
        private VisualElement MakePen(string speciesKey, float leftPct, float topPx)
        {
            int    count  = _state.AnimalCounts.TryGetValue(speciesKey, out int c) ? c : 0;
            string name   = DefaultAnimalData.NameOf(speciesKey);

            // Outer pen: tan/sand tile with fence-feel border.
            // overflow: Visible intentionally — no clipping so sprite top is never cut.
            var pen = new VisualElement();
            pen.style.position        = Position.Absolute;
            pen.style.left            = new StyleLength(new Length(leftPct, LengthUnit.Percent));
            pen.style.top             = new StyleLength(new Length(topPx,   LengthUnit.Pixel));
            pen.style.width           = 110;
            pen.style.height          = 120;
            pen.style.flexDirection   = FlexDirection.Column;
            pen.style.alignItems      = Align.Center;
            pen.style.justifyContent  = Justify.FlexEnd; // text at bottom, sprite can extend above
            pen.style.backgroundColor = ColPenBg;
            pen.style.borderTopLeftRadius     = 12;
            pen.style.borderTopRightRadius    = 12;
            pen.style.borderBottomLeftRadius  = 12;
            pen.style.borderBottomRightRadius = 12;
            pen.style.borderTopWidth    = 2;
            pen.style.borderRightWidth  = 2;
            pen.style.borderBottomWidth = 3;
            pen.style.borderLeftWidth   = 2;
            pen.style.borderTopColor    = ColPenBorder;
            pen.style.borderRightColor  = ColPenBorder;
            pen.style.borderBottomColor = ColPenBorder;
            pen.style.borderLeftColor   = ColPenBorder;
            pen.style.paddingBottom     = 6;
            pen.style.paddingLeft       = 4;
            pen.style.paddingRight      = 4;
            // No overflow:Hidden — sprites can breathe above the tile top edge
            pen.style.overflow = Overflow.Visible;

            // Animal sprite — positioned absolutely inside pen for precise headroom control.
            // Negative top places the sprite so its bottom half is inside the pen tile and
            // its upper half (ears, head) extends above the tile border without clipping.
            var spriteContainer = new VisualElement();
            spriteContainer.style.position        = Position.Absolute;
            spriteContainer.style.top             = new StyleLength(new Length(-28f, LengthUnit.Pixel)); // 28px headroom above tile
            spriteContainer.style.left            = new StyleLength(new Length(50f,  LengthUnit.Percent));
            spriteContainer.style.width           = 0; // zero-width anchor — sprite itself is centred via marginLeft
            spriteContainer.style.overflow        = Overflow.Visible;

            var sprite = MakeSprite($"animal:{speciesKey}", 64f);
            sprite.style.marginLeft = -32; // half of 64px to centre over anchor
            spriteContainer.Add(sprite);
            pen.Add(spriteContainer);

            // Species name label
            var nameLbl = new Label(name);
            nameLbl.style.fontSize                = 10;
            nameLbl.style.color                   = ColTextDark;
            nameLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            nameLbl.style.unityTextAlign          = TextAnchor.UpperCenter;
            nameLbl.style.whiteSpace              = WhiteSpace.Normal;
            pen.Add(nameLbl);

            // Count label
            var countLbl = new Label($"x{count}");
            countLbl.style.fontSize       = 10;
            countLbl.style.color          = ColTextMid;
            countLbl.style.unityTextAlign = TextAnchor.UpperCenter;
            pen.Add(countLbl);

            // Tap to go to Animals tab
            pen.RegisterCallback<PointerDownEvent>(_ => SwitchTab(Tab.Animals));

            return pen;
        }

        /// <summary>
        /// Places a decor sprite at absolute (leftPct%, topPx) inside the map canvas.
        /// Purely decorative — no interaction.
        /// </summary>
        private VisualElement PlaceDecor(string cacheKey, float leftPct, float topPx, float size)
        {
            var img = MakeSprite(cacheKey, size);
            img.style.position = Position.Absolute;
            img.style.left     = new StyleLength(new Length(leftPct, LengthUnit.Percent));
            img.style.top      = new StyleLength(new Length(topPx,   LengthUnit.Pixel));
            // Translate left by half the sprite width so leftPct is the sprite centre
            img.style.marginLeft = -(size / 2f);
            img.pickingMode    = PickingMode.Ignore; // decorations don't intercept touches
            return img;
        }

        private static VisualElement MakeSummaryRow(string label, string value)
        {
            var row = new VisualElement();
            row.style.flexDirection  = FlexDirection.Row;
            row.style.justifyContent = Justify.SpaceBetween;
            row.style.alignItems     = Align.Center;
            row.style.marginBottom   = 6;

            var lbl = new Label(label);
            lbl.style.fontSize = 13;
            lbl.style.color    = ColTextMid;

            var val = new Label(value);
            val.style.fontSize                = 13;
            val.style.color                   = ColTextDark;
            val.style.unityFontStyleAndWeight = FontStyle.Bold;

            row.Add(lbl);
            row.Add(val);
            return row;
        }

        // ════════════════════════════════════════════════════════════════════
        // TAB: Animals  (care + adopt — original content)
        // ════════════════════════════════════════════════════════════════════
        private void BuildAnimalsTab()
        {
            // Your Animals section
            _bodyScroll.Add(MakeSectionHeader("Your Animals"));

            var animalContainer = new VisualElement();
            animalContainer.style.paddingLeft  = 10;
            animalContainer.style.paddingRight = 10;
            foreach (string key in _state.OwnedSpecies)
                animalContainer.Add(BuildAnimalCard(key));
            _bodyScroll.Add(animalContainer);

            // Adopt New Species section
            _bodyScroll.Add(MakeSectionHeader("Adopt New Species"));

            var adoptContainer = new VisualElement();
            adoptContainer.style.paddingLeft  = 10;
            adoptContainer.style.paddingRight = 10;

            bool anyAdoptable = false;
            foreach (var a in DefaultAnimalData.All)
            {
                if (Array.IndexOf(_state.OwnedSpecies, a.Key) >= 0) continue;
                adoptContainer.Add(BuildAdoptRow(a));
                anyAdoptable = true;
            }
            if (!anyAdoptable)
            {
                var msg = new Label("All species adopted!");
                msg.style.color       = ColTextGreen;
                msg.style.fontSize    = 14;
                msg.style.marginLeft  = 8;
                msg.style.marginBottom = 8;
                adoptContainer.Add(msg);
            }
            _bodyScroll.Add(adoptContainer);

            // DEV shortcuts (kept in Animals tab for easy access)
            var devHeader = MakeSectionHeader("[DEV]");
            devHeader.style.opacity = 0.55f;
            _bodyScroll.Add(devHeader);

            var devRow = new VisualElement();
            devRow.style.flexDirection = FlexDirection.Row;
            devRow.style.alignItems    = Align.Center;
            devRow.style.paddingLeft   = 10;
            devRow.style.paddingRight  = 10;
            devRow.style.paddingBottom = 12;
            devRow.style.flexWrap      = Wrap.Wrap;

            devRow.Add(MakeDevButton("+1000 Gold", () => { _currency.Grant(CurrencyType.Gold, 1000); FullRefresh(); }));
            devRow.Add(MakeDevButton("+5000 XP",   () => { _level.AddXp(5000);                      FullRefresh(); }));
            devRow.Add(MakeDevButton("Reset",       () => { BuildDomain();                           FullRefresh(); }));
            _bodyScroll.Add(devRow);
        }

        // ── Animal card (unchanged logic) ────────────────────────────────────
        private VisualElement BuildAnimalCard(string key)
        {
            int          count  = _state.AnimalCounts.TryGetValue(key, out int c) ? c : 0;
            int          encLv  = _habitat.EnclosureLevel(key);
            int          enrLv  = _enrichment.EnrichmentLevel(key);
            AnimalMeters meters = _care.GetMeters(key) ?? new AnimalMeters();
            double       appeal = _economy.AppealOf(key);

            var card = new VisualElement();
            StyleCard(card);

            var topRow = new VisualElement();
            topRow.style.flexDirection = FlexDirection.Row;
            topRow.style.alignItems    = Align.Center;
            topRow.style.marginBottom  = 8;

            var sprite = MakeSprite($"animal:{key}", 64f);
            sprite.style.marginRight = 10;
            sprite.style.marginTop   = 4; // headroom so ears never clip card top edge
            topRow.Add(sprite);

            var infoCol = new VisualElement();
            infoCol.style.flexDirection = FlexDirection.Column;
            infoCol.style.flexGrow      = 1;

            var nameRow = new VisualElement();
            nameRow.style.flexDirection = FlexDirection.Row;
            nameRow.style.alignItems    = Align.Center;

            var nameLabel = new Label(DefaultAnimalData.NameOf(key));
            nameLabel.style.fontSize                = 17;
            nameLabel.style.color                   = ColTextDark;
            nameLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            nameRow.Add(nameLabel);

            var countLabel = new Label($"  x{count}");
            countLabel.style.fontSize = 14;
            countLabel.style.color    = ColTextMid;
            nameRow.Add(countLabel);

            infoCol.Add(nameRow);

            var metaLabel = new Label($"Enc {encLv}/5  ·  Enr {enrLv}/5  ·  Appeal {appeal:0.#}");
            metaLabel.style.fontSize  = 11;
            metaLabel.style.color     = ColTextLight;
            metaLabel.style.marginTop = 2;
            infoCol.Add(metaLabel);

            topRow.Add(infoCol);
            card.Add(topRow);

            card.Add(BuildMeterRow("Hunger", meters.Hunger, ColBarHunger));
            card.Add(BuildMeterRow("Thirst", meters.Thirst, ColBarThirst));
            card.Add(BuildMeterRow("Clean",  meters.Clean,  ColBarClean));
            card.Add(BuildMeterRow("Happy",  meters.Happy,  ColBarHappy));

            var careRow = new VisualElement();
            careRow.style.flexDirection = FlexDirection.Row;
            careRow.style.alignItems    = Align.Center;
            careRow.style.marginTop     = 8;
            careRow.style.flexWrap      = Wrap.Wrap;

            careRow.Add(MakeCareButton("Feed",  "icon:feed",  () => { _care.DoAction(key, CareActionType.Feed);  FullRefresh(); }));
            careRow.Add(MakeCareButton("Water", "icon:water", () => { _care.DoAction(key, CareActionType.Water); FullRefresh(); }));
            careRow.Add(MakeCareButton("Clean", "icon:clean", () => { _care.DoAction(key, CareActionType.Clean); FullRefresh(); }));
            careRow.Add(MakeCareButton("Pet",   "icon:pet",   () => { _care.DoAction(key, CareActionType.Pet);   FullRefresh(); }));
            card.Add(careRow);

            var econRow = new VisualElement();
            econRow.style.flexDirection = FlexDirection.Row;
            econRow.style.alignItems    = Align.Center;
            econRow.style.marginTop     = 4;
            econRow.style.flexWrap      = Wrap.Wrap;

            econRow.Add(MakeEconButton($"Buy +1  ({BuyCost(key):n0}g)", () =>
            {
                _collection.BuyMore(key);
                FullRefresh();
            }));

            if (encLv < 5)
            {
                econRow.Add(MakeEconButton($"Upgrade Enc  ({UpgradeCost(key):n0}g)", () =>
                {
                    _habitat.Upgrade(key);
                    FullRefresh();
                }));
            }
            else
            {
                var maxLabel = new Label("Enc MAX");
                maxLabel.style.fontSize    = 11;
                maxLabel.style.color       = ColMaxText;
                maxLabel.style.marginRight = 8;
                maxLabel.style.alignSelf   = Align.Center;
                econRow.Add(maxLabel);
            }

            if (enrLv < 5)
            {
                econRow.Add(MakeEconButton($"+Enrichment  ({EnrichCost(key):n0}g)", () =>
                {
                    _enrichment.AddEnrichment(key);
                    FullRefresh();
                }));
            }
            else
            {
                var maxLabel = new Label("Enr MAX");
                maxLabel.style.fontSize    = 11;
                maxLabel.style.color       = ColMaxText;
                maxLabel.style.marginRight = 8;
                maxLabel.style.alignSelf   = Align.Center;
                econRow.Add(maxLabel);
            }

            card.Add(econRow);
            return card;
        }

        private static VisualElement BuildMeterRow(string meterName, float value, Color barColor)
        {
            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.alignItems    = Align.Center;
            row.style.marginTop     = 3;

            var label = new Label(meterName);
            label.style.width    = 46;
            label.style.fontSize = 11;
            label.style.color    = ColTextMid;

            var track = new VisualElement();
            track.style.flexGrow               = 1;
            track.style.height                 = 7;
            track.style.backgroundColor        = ColBarTrack;
            track.style.borderTopLeftRadius    = 4;
            track.style.borderTopRightRadius   = 4;
            track.style.borderBottomLeftRadius = 4;
            track.style.borderBottomRightRadius = 4;
            track.style.overflow               = Overflow.Hidden;
            track.style.marginLeft             = 4;
            track.style.marginRight            = 4;

            var fill = new VisualElement();
            float pct = Mathf.Clamp01(value / 100f);
            fill.style.width                      = new StyleLength(new Length(pct * 100f, LengthUnit.Percent));
            fill.style.height                     = 7;
            fill.style.backgroundColor            = barColor;
            fill.style.borderTopLeftRadius        = 4;
            fill.style.borderTopRightRadius       = 4;
            fill.style.borderBottomLeftRadius     = 4;
            fill.style.borderBottomRightRadius    = 4;
            track.Add(fill);

            var valLabel = new Label($"{value:0}");
            valLabel.style.width          = 28;
            valLabel.style.fontSize       = 11;
            valLabel.style.color          = ColTextMid;
            valLabel.style.unityTextAlign = TextAnchor.UpperRight;

            row.Add(label);
            row.Add(track);
            row.Add(valLabel);
            return row;
        }

        private VisualElement BuildAdoptRow(DefaultAnimalData.AnimalInfo a)
        {
            var row = new VisualElement();
            row.style.flexDirection              = FlexDirection.Row;
            row.style.alignItems                 = Align.Center;
            row.style.backgroundColor            = ColAdoptRow;
            row.style.borderTopLeftRadius        = 10;
            row.style.borderTopRightRadius       = 10;
            row.style.borderBottomLeftRadius     = 10;
            row.style.borderBottomRightRadius    = 10;
            row.style.marginBottom               = 5;
            row.style.paddingLeft                = 10;
            row.style.paddingRight               = 8;
            row.style.paddingTop                 = 7;
            row.style.paddingBottom              = 7;
            row.style.borderTopWidth             = 1;
            row.style.borderRightWidth           = 1;
            row.style.borderBottomWidth          = 1;
            row.style.borderLeftWidth            = 1;
            row.style.borderTopColor             = ColCardBorder;
            row.style.borderRightColor           = ColCardBorder;
            row.style.borderBottomColor          = ColCardBorder;
            row.style.borderLeftColor            = ColCardBorder;

            var sprite = MakeSprite($"animal:{a.Key}", 40f);
            sprite.style.marginRight = 10;
            sprite.style.marginTop   = 2; // headroom so ears don't clip row top edge
            row.Add(sprite);

            var nameLabel = new Label(a.Name);
            nameLabel.style.flexGrow                = 1;
            nameLabel.style.fontSize                = 14;
            nameLabel.style.color                   = ColTextDark;
            nameLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            row.Add(nameLabel);

            var appealLabel = new Label($"Appeal {a.Appeal:0}");
            appealLabel.style.fontSize    = 11;
            appealLabel.style.color       = ColTextGreen;
            appealLabel.style.marginRight = 8;
            row.Add(appealLabel);

            bool unlocked = _level.IsUnlocked(a.UnlockLevel);
            if (unlocked)
            {
                var btn = MakeEconButton("Adopt (50g)", () =>
                {
                    _collection.Unlock(a.Key);
                    _collection.BuyMore(a.Key);
                    FullRefresh();
                });
                row.Add(btn);
            }
            else
            {
                var lockLabel = new Label($"Lv {a.UnlockLevel}");
                lockLabel.style.fontSize                = 11;
                lockLabel.style.color                   = ColLockText;
                lockLabel.style.backgroundColor         = new Color(0.878f, 0.878f, 0.878f, 1f);
                lockLabel.style.borderTopLeftRadius     = 8;
                lockLabel.style.borderTopRightRadius    = 8;
                lockLabel.style.borderBottomLeftRadius  = 8;
                lockLabel.style.borderBottomRightRadius = 8;
                lockLabel.style.paddingLeft             = 6;
                lockLabel.style.paddingRight            = 6;
                lockLabel.style.paddingTop              = 3;
                lockLabel.style.paddingBottom           = 3;
                row.Add(lockLabel);
            }

            return row;
        }

        // ════════════════════════════════════════════════════════════════════
        // TAB: Attract  (build attractions — Fe4)
        // ════════════════════════════════════════════════════════════════════

        // Attraction data: name, key, gold cost, unlock level
        private static readonly (string Name, string Key, long Cost, int UnlockLevel)[] AttractionDefs =
        {
            ("Petting Area",      "petting", 500,   7),
            ("Feeding Zone",      "feeding", 2500,  18),
            ("Animal Shows",      "shows",   8000,  26),
            ("Safari Rides",      "rides",   16000, 30),
            ("Performance Arena", "arena",   45000, 45),
        };

        private void BuildAttractTab()
        {
            int builtCount = _state.BuiltAttractions != null ? _state.BuiltAttractions.Length : 0;
            float goldMult = 1f + 0.12f * builtCount;
            float capMult  = 1f + 0.15f * builtCount;

            _bodyScroll.Add(MakeSectionHeader("Attractions"));

            // Header info card
            var infoCard = new VisualElement();
            StyleCard(infoCard);
            infoCard.style.marginLeft  = 10;
            infoCard.style.marginRight = 10;

            var builtLine = new Label($"Built: {builtCount}/5   |   Each attraction: +12% gold, +15% capacity");
            builtLine.style.fontSize    = 12;
            builtLine.style.color       = ColTextMid;
            builtLine.style.whiteSpace  = WhiteSpace.Normal;
            builtLine.style.marginBottom = 4;
            infoCard.Add(builtLine);

            var multLine = new Label($"Current multipliers — Gold: x{goldMult:0.00}   Capacity: x{capMult:0.00}");
            multLine.style.fontSize = 12;
            multLine.style.color    = ColTextGreen;
            multLine.style.whiteSpace = WhiteSpace.Normal;
            infoCard.Add(multLine);

            _bodyScroll.Add(infoCard);

            // Attraction rows
            var listContainer = new VisualElement();
            listContainer.style.paddingLeft  = 10;
            listContainer.style.paddingRight = 10;
            listContainer.style.marginTop    = 6;

            foreach (var (name, key, cost, unlockLv) in AttractionDefs)
            {
                listContainer.Add(BuildAttractionRow(name, key, cost, unlockLv));
            }

            _bodyScroll.Add(listContainer);
        }

        private VisualElement BuildAttractionRow(string name, string key, long cost, int unlockLv)
        {
            var row = new VisualElement();
            row.style.flexDirection              = FlexDirection.Row;
            row.style.alignItems                 = Align.Center;
            row.style.backgroundColor            = ColCardBg;
            row.style.borderTopLeftRadius        = 10;
            row.style.borderTopRightRadius       = 10;
            row.style.borderBottomLeftRadius     = 10;
            row.style.borderBottomRightRadius    = 10;
            row.style.marginBottom               = 6;
            row.style.paddingLeft                = 12;
            row.style.paddingRight               = 8;
            row.style.paddingTop                 = 10;
            row.style.paddingBottom              = 10;
            row.style.borderTopWidth             = 1;
            row.style.borderRightWidth           = 1;
            row.style.borderBottomWidth          = 2;
            row.style.borderLeftWidth            = 1;
            row.style.borderTopColor             = ColCardBorder;
            row.style.borderRightColor           = ColCardBorder;
            row.style.borderBottomColor          = ColCardBorder;
            row.style.borderLeftColor            = ColCardBorder;

            // Name + cost column
            var nameCol = new VisualElement();
            nameCol.style.flexDirection = FlexDirection.Column;
            nameCol.style.flexGrow      = 1;

            var nameLbl = new Label(name);
            nameLbl.style.fontSize                = 14;
            nameLbl.style.color                   = ColTextDark;
            nameLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            nameCol.Add(nameLbl);

            var costLbl = new Label($"{cost:n0} g   |   Unlocks Lv {unlockLv}");
            costLbl.style.fontSize = 11;
            costLbl.style.color    = ColTextLight;
            nameCol.Add(costLbl);

            row.Add(nameCol);

            // State: built / button / locked
            bool isBuilt = _state.BuiltAttractions != null &&
                           Array.IndexOf(_state.BuiltAttractions, key) >= 0;

            if (isBuilt)
            {
                var builtLbl = new Label("Built");
                builtLbl.style.fontSize                = 12;
                builtLbl.style.color                   = ColTextGreen;
                builtLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
                builtLbl.style.backgroundColor         = new Color(0.216f, 0.718f, 0.420f, 0.12f);
                builtLbl.style.borderTopLeftRadius     = 8;
                builtLbl.style.borderTopRightRadius    = 8;
                builtLbl.style.borderBottomLeftRadius  = 8;
                builtLbl.style.borderBottomRightRadius = 8;
                builtLbl.style.paddingLeft             = 8;
                builtLbl.style.paddingRight            = 8;
                builtLbl.style.paddingTop              = 4;
                builtLbl.style.paddingBottom           = 4;
                row.Add(builtLbl);
            }
            else if (_level.IsUnlocked(unlockLv))
            {
                var buildBtn = MakeEconButton($"Build ({cost:n0}g)", () =>
                {
                    if (_currency.TryPay(CurrencyType.Gold, cost))
                    {
                        // Append key to BuiltAttractions array
                        string[] existing = _state.BuiltAttractions ?? new string[0];
                        var next = new string[existing.Length + 1];
                        for (int i = 0; i < existing.Length; i++) next[i] = existing[i];
                        next[existing.Length] = key;
                        _state.BuiltAttractions = next;
                    }
                    FullRefresh();
                });
                row.Add(buildBtn);
            }
            else
            {
                var lockLbl = new Label($"Lv {unlockLv}");
                lockLbl.style.fontSize                = 11;
                lockLbl.style.color                   = ColLockText;
                lockLbl.style.backgroundColor         = new Color(0.878f, 0.878f, 0.878f, 1f);
                lockLbl.style.borderTopLeftRadius     = 8;
                lockLbl.style.borderTopRightRadius    = 8;
                lockLbl.style.borderBottomLeftRadius  = 8;
                lockLbl.style.borderBottomRightRadius = 8;
                lockLbl.style.paddingLeft             = 6;
                lockLbl.style.paddingRight            = 6;
                lockLbl.style.paddingTop              = 3;
                lockLbl.style.paddingBottom           = 3;
                row.Add(lockLbl);
            }

            return row;
        }

        // ════════════════════════════════════════════════════════════════════
        // TAB: Activities  (timed gold-earning actions)
        // ════════════════════════════════════════════════════════════════════

        private static readonly (string Name, string RequiredAnimal, long GoldReward, float Cooldown)[] ActivityDefs =
        {
            ("Rabbit Photo",   "rabbit",   120,  10f),
            ("Goat Feeding",   "goat",     250,  15f),
            ("Monkey Show",    "monkey",   600,  20f),
            ("Lion Encounter", "lion",     1200, 30f),
            ("Elephant Ride",  "elephant", 1500, 30f),
        };

        private void BuildActivitiesTab()
        {
            _bodyScroll.Add(MakeSectionHeader("Activities"));

            var infoLbl = new Label("Complete activities to earn bonus gold. Each has a short cooldown.");
            infoLbl.style.fontSize     = 12;
            infoLbl.style.color        = ColTextMid;
            infoLbl.style.marginLeft   = 12;
            infoLbl.style.marginRight  = 12;
            infoLbl.style.marginTop    = 4;
            infoLbl.style.marginBottom = 8;
            infoLbl.style.whiteSpace   = WhiteSpace.Normal;
            _bodyScroll.Add(infoLbl);

            var listContainer = new VisualElement();
            listContainer.style.paddingLeft  = 10;
            listContainer.style.paddingRight = 10;

            float now = Time.time;

            foreach (var (actName, requiredAnimal, goldReward, cooldown) in ActivityDefs)
            {
                listContainer.Add(BuildActivityRow(actName, requiredAnimal, goldReward, cooldown, now));
            }

            _bodyScroll.Add(listContainer);
        }

        private VisualElement BuildActivityRow(string actName, string requiredAnimal,
                                               long goldReward, float cooldown, float now)
        {
            var row = new VisualElement();
            row.style.flexDirection              = FlexDirection.Row;
            row.style.alignItems                 = Align.Center;
            row.style.backgroundColor            = ColCardBg;
            row.style.borderTopLeftRadius        = 10;
            row.style.borderTopRightRadius       = 10;
            row.style.borderBottomLeftRadius     = 10;
            row.style.borderBottomRightRadius    = 10;
            row.style.marginBottom               = 6;
            row.style.paddingLeft                = 12;
            row.style.paddingRight               = 8;
            row.style.paddingTop                 = 10;
            row.style.paddingBottom              = 10;
            row.style.borderTopWidth             = 1;
            row.style.borderRightWidth           = 1;
            row.style.borderBottomWidth          = 2;
            row.style.borderLeftWidth            = 1;
            row.style.borderTopColor             = ColCardBorder;
            row.style.borderRightColor           = ColCardBorder;
            row.style.borderBottomColor          = ColCardBorder;
            row.style.borderLeftColor            = ColCardBorder;

            // Name + reward column
            var nameCol = new VisualElement();
            nameCol.style.flexDirection = FlexDirection.Column;
            nameCol.style.flexGrow      = 1;

            var nameLbl = new Label(actName);
            nameLbl.style.fontSize                = 14;
            nameLbl.style.color                   = ColTextDark;
            nameLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            nameCol.Add(nameLbl);

            var rewardLbl = new Label($"+{goldReward:n0} gold   |   {cooldown:0}s cooldown");
            rewardLbl.style.fontSize = 11;
            rewardLbl.style.color    = ColTextLight;
            nameCol.Add(rewardLbl);

            row.Add(nameCol);

            // Determine state
            bool animalOwned = Array.IndexOf(_state.OwnedSpecies, requiredAnimal) >= 0;

            if (!animalOwned)
            {
                string animalName = DefaultAnimalData.NameOf(requiredAnimal);
                var needLbl = new Label($"Need {animalName}");
                needLbl.style.fontSize = 12;
                needLbl.style.color    = ColLockText;
                needLbl.style.backgroundColor         = new Color(0.878f, 0.878f, 0.878f, 1f);
                needLbl.style.borderTopLeftRadius     = 8;
                needLbl.style.borderTopRightRadius    = 8;
                needLbl.style.borderBottomLeftRadius  = 8;
                needLbl.style.borderBottomRightRadius = 8;
                needLbl.style.paddingLeft             = 6;
                needLbl.style.paddingRight            = 6;
                needLbl.style.paddingTop              = 3;
                needLbl.style.paddingBottom           = 3;
                row.Add(needLbl);
            }
            else
            {
                _activityLastUsed.TryGetValue(actName, out float lastUsed);
                float elapsed  = now - lastUsed;
                float remaining = cooldown - elapsed;

                if (remaining > 0f && lastUsed > 0f)
                {
                    // On cooldown
                    var cdLbl = new Label($"Ready in {Mathf.CeilToInt(remaining)}s");
                    cdLbl.style.fontSize = 12;
                    cdLbl.style.color    = ColTextMid;
                    cdLbl.style.backgroundColor         = new Color(0.949f, 0.698f, 0.157f, 0.18f);
                    cdLbl.style.borderTopLeftRadius     = 8;
                    cdLbl.style.borderTopRightRadius    = 8;
                    cdLbl.style.borderBottomLeftRadius  = 8;
                    cdLbl.style.borderBottomRightRadius = 8;
                    cdLbl.style.paddingLeft             = 8;
                    cdLbl.style.paddingRight            = 8;
                    cdLbl.style.paddingTop              = 4;
                    cdLbl.style.paddingBottom           = 4;
                    row.Add(cdLbl);
                }
                else
                {
                    // Ready to use
                    var doBtn = MakeCareButton($"Do (+{goldReward:n0}g)", "icon:coin", () =>
                    {
                        _currency.Grant(CurrencyType.Gold, goldReward);
                        _activityLastUsed[actName] = Time.time;
                        FullRefresh();
                    });
                    row.Add(doBtn);
                }
            }

            return row;
        }

        // ════════════════════════════════════════════════════════════════════
        // TAB: Shop  (currency sinks / conversions)
        // ════════════════════════════════════════════════════════════════════
        private void BuildShopTab()
        {
            _bodyScroll.Add(MakeSectionHeader("Shop"));

            // Currency display card
            var balanceCard = new VisualElement();
            StyleCard(balanceCard);
            balanceCard.style.marginLeft  = 10;
            balanceCard.style.marginRight = 10;

            long gold = _currency.Balance(CurrencyType.Gold);
            long gems = _currency.Balance(CurrencyType.Gems);

            balanceCard.Add(MakeSummaryRow("Gold",    $"{gold:n0}"));
            balanceCard.Add(MakeSummaryRow("Gems",    $"{gems:n0}"));
            _bodyScroll.Add(balanceCard);

            // Conversions section
            _bodyScroll.Add(MakeSectionHeader("Conversions"));

            var convContainer = new VisualElement();
            convContainer.style.paddingLeft  = 10;
            convContainer.style.paddingRight = 10;

            convContainer.Add(BuildShopRow(
                "1 Gem -> 500 Gold",
                "Convert 1 gem into 500 gold",
                () =>
                {
                    _currency.TryPay(CurrencyType.Gems, 1);
                    _currency.Grant(CurrencyType.Gold, 500);
                    FullRefresh();
                }));

            convContainer.Add(BuildShopRow(
                "5 Gems -> 3000 Gold",
                "Convert 5 gems into 3000 gold",
                () =>
                {
                    _currency.TryPay(CurrencyType.Gems, 5);
                    _currency.Grant(CurrencyType.Gold, 3000);
                    FullRefresh();
                }));

            _bodyScroll.Add(convContainer);

            // Gifts section
            _bodyScroll.Add(MakeSectionHeader("Daily Gift"));

            var giftContainer = new VisualElement();
            giftContainer.style.paddingLeft  = 10;
            giftContainer.style.paddingRight = 10;

            if (_dailyGiftClaimed)
            {
                var claimedLbl = new Label("Daily gift already claimed this session.");
                claimedLbl.style.fontSize     = 13;
                claimedLbl.style.color        = ColTextMid;
                claimedLbl.style.marginTop    = 8;
                claimedLbl.style.marginBottom = 8;
                claimedLbl.style.marginLeft   = 4;
                giftContainer.Add(claimedLbl);
            }
            else
            {
                giftContainer.Add(BuildShopRow(
                    "Daily Gift: +200 Gold",
                    "Free gold, once per session",
                    () =>
                    {
                        _currency.Grant(CurrencyType.Gold, 200);
                        _dailyGiftClaimed = true;
                        FullRefresh();
                    }));
            }

            _bodyScroll.Add(giftContainer);
        }

        private static VisualElement BuildShopRow(string title, string subtitle, Action onClick)
        {
            var row = new VisualElement();
            row.style.flexDirection              = FlexDirection.Row;
            row.style.alignItems                 = Align.Center;
            row.style.backgroundColor            = ColCardBg;
            row.style.borderTopLeftRadius        = 10;
            row.style.borderTopRightRadius       = 10;
            row.style.borderBottomLeftRadius     = 10;
            row.style.borderBottomRightRadius    = 10;
            row.style.marginBottom               = 6;
            row.style.paddingLeft                = 12;
            row.style.paddingRight               = 8;
            row.style.paddingTop                 = 10;
            row.style.paddingBottom              = 10;
            row.style.borderTopWidth             = 1;
            row.style.borderRightWidth           = 1;
            row.style.borderBottomWidth          = 2;
            row.style.borderLeftWidth            = 1;
            row.style.borderTopColor             = ColCardBorder;
            row.style.borderRightColor           = ColCardBorder;
            row.style.borderBottomColor          = ColCardBorder;
            row.style.borderLeftColor            = ColCardBorder;

            var textCol = new VisualElement();
            textCol.style.flexDirection = FlexDirection.Column;
            textCol.style.flexGrow      = 1;

            var titleLbl = new Label(title);
            titleLbl.style.fontSize                = 14;
            titleLbl.style.color                   = ColTextDark;
            titleLbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            textCol.Add(titleLbl);

            var subLbl = new Label(subtitle);
            subLbl.style.fontSize = 11;
            subLbl.style.color    = ColTextLight;
            textCol.Add(subLbl);

            row.Add(textCol);

            var btn = MakeEconButton("Get", onClick);
            row.Add(btn);

            return row;
        }

        // ── Refresh (cheap — update existing labels, don't rebuild tree) ──────
        private void RefreshHud()
        {
            long  gold  = _currency.Balance(CurrencyType.Gold);
            long  gems  = _currency.Balance(CurrencyType.Gems);
            int   level = _level.Level;
            int   xp    = _state.Xp;
            long  gps   = _economy.GoldPerSec();
            long  cap   = _economy.Capacity();
            float happy = _care.AvgHappiness();

            _lblGold.text  = $"{gold:n0}";
            _lblGems.text  = $"{gems:n0}";
            _lblLevel.text = $"{level}";
            _lblGps.text   = $"{gps:n0} g/s";
            _lblCap.text   = $"Cap: {cap:n0}";
            _lblHappy.text = $"Happy: {happy:0}%";

            _lblXp.text = $"Lv {level}  ·  {xp:n0} XP  ·  Lv {level + 1}";

            float xpFrac = Mathf.Clamp01((float)xp / Mathf.Max(1f, xp + 500));
            _xpBar.style.width = new StyleLength(new Length(xpFrac * 100f, LengthUnit.Percent));
        }

        /// <summary>
        /// 0.25-second cadence refresh: always updates HUD, rebuilds the current tab's
        /// content so meter decay, countdown timers, and unlock state stay accurate.
        /// </summary>
        private void RefreshUI()
        {
            RefreshHud();
            RebuildCurrentTab();
        }

        /// <summary>Called immediately after any user action that changes state.</summary>
        private void FullRefresh()
        {
            RefreshHud();
            RebuildCurrentTab();
        }

        // ── Style helpers ────────────────────────────────────────────────────

        private static void StyleCard(VisualElement el)
        {
            el.style.backgroundColor              = ColCardBg;
            el.style.borderTopLeftRadius          = 14;
            el.style.borderTopRightRadius         = 14;
            el.style.borderBottomLeftRadius       = 14;
            el.style.borderBottomRightRadius      = 14;
            el.style.paddingLeft                  = 12;
            el.style.paddingRight                 = 12;
            el.style.paddingTop                   = 12;
            el.style.paddingBottom                = 12;
            el.style.marginBottom                 = 10;
            el.style.borderTopWidth               = 1;
            el.style.borderRightWidth             = 1;
            el.style.borderBottomWidth            = 2;
            el.style.borderLeftWidth              = 1;
            el.style.borderTopColor               = ColCardBorder;
            el.style.borderRightColor             = ColCardBorder;
            el.style.borderBottomColor            = ColCardBorder;
            el.style.borderLeftColor              = ColCardBorder;
        }

        private static Label MakeSectionHeader(string text)
        {
            var lbl = new Label(text);
            lbl.style.fontSize                = 13;
            lbl.style.color                   = ColSectionText;
            lbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            lbl.style.backgroundColor         = ColSectionChip;
            lbl.style.borderTopLeftRadius     = 8;
            lbl.style.borderTopRightRadius    = 8;
            lbl.style.borderBottomLeftRadius  = 8;
            lbl.style.borderBottomRightRadius = 8;
            lbl.style.paddingLeft             = 10;
            lbl.style.paddingRight            = 10;
            lbl.style.paddingTop              = 4;
            lbl.style.paddingBottom           = 4;
            lbl.style.marginTop               = 12;
            lbl.style.marginBottom            = 6;
            lbl.style.marginLeft              = 10;
            lbl.style.alignSelf               = Align.FlexStart;
            return lbl;
        }

        /// <summary>Care button: green with icon + label side by side.</summary>
        private Button MakeCareButton(string label, string iconKey, Action clicked)
        {
            var btn = new Button(clicked);
            btn.style.flexDirection              = FlexDirection.Row;
            btn.style.alignItems                 = Align.Center;
            btn.style.backgroundColor            = ColCareBg;
            btn.style.color                      = ColCareText;
            btn.style.fontSize                   = 12;
            btn.style.paddingLeft                = 8;
            btn.style.paddingRight               = 10;
            btn.style.paddingTop                 = 5;
            btn.style.paddingBottom              = 5;
            btn.style.marginRight                = 4;
            btn.style.marginBottom               = 4;
            btn.style.borderTopLeftRadius        = 10;
            btn.style.borderTopRightRadius       = 10;
            btn.style.borderBottomLeftRadius     = 10;
            btn.style.borderBottomRightRadius    = 10;
            btn.style.borderTopWidth             = 0;
            btn.style.borderRightWidth           = 0;
            btn.style.borderBottomWidth          = 0;
            btn.style.borderLeftWidth            = 0;
            btn.style.unityFontStyleAndWeight    = FontStyle.Bold;

            var icon = MakeSprite(iconKey, 16f);
            icon.style.marginRight = 4;
            btn.text = string.Empty;
            btn.Add(icon);

            var lbl = new Label(label);
            lbl.style.color                   = ColCareText;
            lbl.style.fontSize                = 12;
            lbl.style.unityFontStyleAndWeight = FontStyle.Bold;
            btn.Add(lbl);

            return btn;
        }

        /// <summary>Economy button: gold/amber accent.</summary>
        private static Button MakeEconButton(string text, Action clicked)
        {
            var btn = new Button(clicked) { text = text };
            btn.style.backgroundColor         = ColEconBg;
            btn.style.color                   = ColEconText;
            btn.style.fontSize                = 12;
            btn.style.paddingLeft             = 10;
            btn.style.paddingRight            = 10;
            btn.style.paddingTop              = 5;
            btn.style.paddingBottom           = 5;
            btn.style.marginRight             = 4;
            btn.style.marginBottom            = 4;
            btn.style.borderTopLeftRadius     = 10;
            btn.style.borderTopRightRadius    = 10;
            btn.style.borderBottomLeftRadius  = 10;
            btn.style.borderBottomRightRadius = 10;
            btn.style.borderTopWidth          = 0;
            btn.style.borderRightWidth        = 0;
            btn.style.borderBottomWidth       = 0;
            btn.style.borderLeftWidth         = 0;
            btn.style.unityFontStyleAndWeight = FontStyle.Bold;
            return btn;
        }

        /// <summary>DEV button: muted gray, small, unobtrusive.</summary>
        private static Button MakeDevButton(string text, Action clicked)
        {
            var btn = new Button(clicked) { text = text };
            btn.style.backgroundColor         = ColDevBg;
            btn.style.color                   = ColDevText;
            btn.style.fontSize                = 11;
            btn.style.paddingLeft             = 8;
            btn.style.paddingRight            = 8;
            btn.style.paddingTop              = 4;
            btn.style.paddingBottom           = 4;
            btn.style.marginRight             = 6;
            btn.style.marginBottom            = 4;
            btn.style.borderTopLeftRadius     = 6;
            btn.style.borderTopRightRadius    = 6;
            btn.style.borderBottomLeftRadius  = 6;
            btn.style.borderBottomRightRadius = 6;
            btn.style.borderTopWidth          = 0;
            btn.style.borderRightWidth        = 0;
            btn.style.borderBottomWidth       = 0;
            btn.style.borderLeftWidth         = 0;
            return btn;
        }
    }
}
