using System;
using UnityEngine;
using AWZ.Domain;

namespace AWZ.Runtime
{
    /// <summary>
    /// Code-only playable vertical slice. Builds the full domain (state + every service)
    /// at runtime with the <see cref="DefaultAnimalData"/> roster, runs the 1-second gold
    /// tick and wall-clock care decay, and draws an interactive IMGUI panel so the core
    /// loop (care → appeal → visitors → gold → adopt/upgrade) is playable in the editor
    /// WITHOUT any scene, ScriptableObject assets, or UI Toolkit files.
    ///
    /// This is a DEVELOPMENT HARNESS, not shipping UI. The shipping path is
    /// AppBootstrap + AWZ.UI screens (UI Toolkit). Remove or disable before release.
    /// </summary>
    public sealed class DevHarness : MonoBehaviour
    {
        private GameState          _state;
        private EventBus           _bus;
        private ICurrencyService   _currency;
        private ILevelService      _level;
        private IEconomyService    _economy;
        private ICareService       _care;
        private IHabitatService    _habitat;
        private IEnrichmentService _enrichment;
        private IAttractionService _attractions;
        private CollectionService  _collection;

        private float  _tickAccum;
        private Vector2 _scroll;
        private GUIStyle _h1, _h2;

        private void Awake() => BuildGame();

        // ── Core construction ────────────────────────────────────────────────
        private void BuildGame()
        {
            _state = new GameState
            {
                Gold          = 200,
                Gems          = 10,
                OwnedSpecies  = new[] { "rabbit" },
                ClosedAtUtc   = DateTime.UtcNow,
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

            Debug.Log("[DevHarness] Game built. Press Play and use the on-screen panel. " +
                      "(Dev harness — not shipping UI.)");
        }

        // ── Tick: gold income + care decay ───────────────────────────────────
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
        }

        // ── Cost formulas (display only — mirror the service formulas) ───────
        private long BuyCost(string key)
        {
            int count = _state.AnimalCounts.TryGetValue(key, out int c) ? c : 0;
            return (long)Math.Round(DefaultAnimalData.AppealOf(key) * 50 * count) + 50;
        }
        private long UpgradeCost(string key)
            => (long)Math.Round(DefaultAnimalData.AppealOf(key) * 80 * _habitat.EnclosureLevel(key)) + 300;
        private long EnrichCost(string key)
            => (long)Math.Round(DefaultAnimalData.AppealOf(key) * 20 * (_enrichment.EnrichmentLevel(key) + 1)) + 200;

        // ── IMGUI panel ──────────────────────────────────────────────────────
        private void OnGUI()
        {
            if (_state == null) return;
            EnsureStyles();

            const float w = 540f;
            GUILayout.BeginArea(new Rect(10, 10, w, Screen.height - 20), GUI.skin.box);
            _scroll = GUILayout.BeginScrollView(_scroll);

            GUILayout.Label("Animal World Zoo — Dev Harness", _h1);
            GUILayout.Label("(code-only playable slice — not the shipping UI)");

            // Top stats
            long gps = _economy.GoldPerSec();
            GUILayout.Space(4);
            GUILayout.Label(
                $"Gold: {_currency.Balance(CurrencyType.Gold):n0}    " +
                $"Gems: {_currency.Balance(CurrencyType.Gems):n0}    " +
                $"Level: {_level.Level}  (XP {_state.Xp:n0})", _h2);
            GUILayout.Label(
                $"Gold/sec: {gps:n0}    Capacity: {_economy.Capacity():n0}    " +
                $"Avg Happiness: {_care.AvgHappiness():0}");

            // Debug shortcuts
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("+1,000 Gold")) _currency.Grant(CurrencyType.Gold, 1000);
            if (GUILayout.Button("+5,000 XP"))   _level.AddXp(5000);
            if (GUILayout.Button("Reset"))       BuildGame();
            GUILayout.EndHorizontal();

            GUILayout.Space(8);
            GUILayout.Label("── Your Animals ──", _h2);
            foreach (string key in _state.OwnedSpecies)
                DrawOwnedAnimal(key);

            GUILayout.Space(8);
            GUILayout.Label("── Adopt New Species ──", _h2);
            foreach (var a in DefaultAnimalData.All)
            {
                if (Array.IndexOf(_state.OwnedSpecies, a.Key) >= 0) continue;
                DrawAdoptRow(a);
            }

            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        private void DrawOwnedAnimal(string key)
        {
            int count = _state.AnimalCounts.TryGetValue(key, out int c) ? c : 0;
            int encLv = _habitat.EnclosureLevel(key);
            int enrLv = _enrichment.EnrichmentLevel(key);
            AnimalMeters m = _care.GetMeters(key) ?? new AnimalMeters();

            GUILayout.BeginVertical(GUI.skin.box);
            GUILayout.Label(
                $"{DefaultAnimalData.NameOf(key)}  ×{count}   " +
                $"Enc Lv{encLv}/5   Enr Lv{enrLv}/5   appeal {_economy.AppealOf(key):0.#}", _h2);
            GUILayout.Label(
                $"Hunger {m.Hunger:0}   Thirst {m.Thirst:0}   Clean {m.Clean:0}   Happy {m.Happy:0}");

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Feed"))  _care.DoAction(key, CareActionType.Feed);
            if (GUILayout.Button("Water")) _care.DoAction(key, CareActionType.Water);
            if (GUILayout.Button("Clean")) _care.DoAction(key, CareActionType.Clean);
            if (GUILayout.Button("Pet"))   _care.DoAction(key, CareActionType.Pet);
            GUILayout.EndHorizontal();

            GUILayout.BeginHorizontal();
            if (GUILayout.Button($"Buy +1  ({BuyCost(key):n0}g)"))    _collection.BuyMore(key);
            if (encLv < 5 && GUILayout.Button($"Upgrade Enc  ({UpgradeCost(key):n0}g)")) _habitat.Upgrade(key);
            if (enrLv < 5 && GUILayout.Button($"+Enrichment  ({EnrichCost(key):n0}g)"))  _enrichment.AddEnrichment(key);
            GUILayout.EndHorizontal();
            GUILayout.EndVertical();
        }

        private void DrawAdoptRow(DefaultAnimalData.AnimalInfo a)
        {
            bool unlocked = _level.IsUnlocked(a.UnlockLevel);
            GUILayout.BeginHorizontal();
            GUILayout.Label($"{a.Name}  (appeal {a.Appeal:0})", GUILayout.Width(220));
            if (unlocked)
            {
                if (GUILayout.Button("Adopt  (50g)"))
                {
                    _collection.Unlock(a.Key);
                    _collection.BuyMore(a.Key); // first copy: round(appeal*50*0)+50 = 50g
                }
            }
            else
            {
                GUILayout.Label($"[locked] unlocks at Lv {a.UnlockLevel}");
            }
            GUILayout.EndHorizontal();
        }

        private void EnsureStyles()
        {
            if (_h1 != null) return;
            _h1 = new GUIStyle(GUI.skin.label) { fontSize = 18, fontStyle = FontStyle.Bold };
            _h2 = new GUIStyle(GUI.skin.label) { fontSize = 14, fontStyle = FontStyle.Bold };
        }
    }
}
