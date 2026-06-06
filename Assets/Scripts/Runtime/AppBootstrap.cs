using System;
using UnityEngine;
using AWZ.Domain;
using AWZ.Data;

namespace AWZ.Runtime
{
    /// <summary>
    /// Composition root. Runs before all other MonoBehaviours (ExecutionOrder -100).
    /// Loads save data, constructs and wires all services, runs offline reconciliation,
    /// then hands off to the UI screens.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class AppBootstrap : MonoBehaviour
    {
        [Header("Data")]
        [SerializeField] private AnimalDatabase _animalDatabase;
        [SerializeField] private TuningConfig   _tuningConfig;

        [Header("Runtime")]
        [SerializeField] private GameController _gameController;
        [SerializeField] private SaveService    _saveService;
        [SerializeField] private TickService    _tickService;

        // UI screens are discovered at boot via the IGameScreen interface (defined in
        // AWZ.Runtime) — AppBootstrap must NOT reference concrete AWZ.UI types, because
        // AWZ.UI already references AWZ.Runtime (referencing back = circular dependency).

        private void Awake()
        {
            ValidateDependencies();

            // ── 1. Load saved state ─────────────────────────────────────────────
            GameState state = _saveService.Load();

            // ── 2. Build appeal/unlock delegates from AnimalDatabase ────────────
            float GetBaseAppeal(string key)  => _animalDatabase.GetDef(key)?.BaseAppeal ?? 0f;
            int   GetUnlockLevel(string key) => _animalDatabase.GetDef(key)?.UnlockLevel ?? 1;

            // ── 3. Construct domain services ────────────────────────────────────
            var eventBus     = new EventBus();
            var currency     = new CurrencyService(state);
            var level        = new LevelService(state, eventBus);
            var attractions  = new AttractionService(state);
            var habitat      = new HabitatService(state, currency, GetBaseAppeal);
            var enrichment   = new EnrichmentService(state, currency, GetBaseAppeal);
            var economy      = new EconomyService(state, habitat, enrichment, attractions, GetBaseAppeal);
            var care         = new CareService(state, level, eventBus);
            var quests       = new QuestService(state, currency, level);
            var idle         = new IdleService(state, economy, currency);
            var collection   = new CollectionService(state, currency, level, GetBaseAppeal, GetUnlockLevel);

            // ── 4. Fe7 Offline reconciliation ───────────────────────────────────
            long pendingGold = idle.ComputeOffline(DateTime.UtcNow);
            if (pendingGold > 0)
            {
                idle.CollectPending();
                Debug.Log($"[AppBootstrap] Offline income granted: {pendingGold} gold.");
            }

            // ── 5. Wire GameController ──────────────────────────────────────────
            _gameController.Initialize(state, currency, level, economy, care,
                                       habitat, enrichment, attractions, quests);

            // ── 6. Initialize UI screens (discovered by interface, no concrete refs) ──
            var behaviours = FindObjectsByType<MonoBehaviour>(
                FindObjectsInactive.Include, FindObjectsSortMode.None);
            int screenCount = 0;
            foreach (var mb in behaviours)
            {
                if (mb is IGameScreen screen)
                {
                    screen.Initialize(_gameController);
                    screenCount++;
                }
            }
            Debug.Log($"[AppBootstrap] Initialized {screenCount} UI screen(s).");

            Debug.Log("[AppBootstrap] Boot complete.");
        }

        private void ValidateDependencies()
        {
            if (_animalDatabase  == null) Debug.LogError("[AppBootstrap] AnimalDatabase is not assigned.");
            if (_tuningConfig    == null) Debug.LogError("[AppBootstrap] TuningConfig is not assigned.");
            if (_gameController  == null) Debug.LogError("[AppBootstrap] GameController is not assigned.");
            if (_saveService     == null) Debug.LogError("[AppBootstrap] SaveService is not assigned.");
        }
    }
}
