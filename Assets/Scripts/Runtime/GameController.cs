using System;
using UnityEngine;
using AWZ.Domain;

namespace AWZ.Runtime
{
    /// <summary>
    /// Composition root and ordered mutation pipeline for the AWZ game.
    /// All GameState mutations are routed through Apply(CommandBase).
    /// Services are injected via Initialize() called from AppBootstrap.
    /// </summary>
    public class GameController : MonoBehaviour
    {
        /// <summary>The single authoritative game state. Read-only from outside Apply.</summary>
        public GameState State { get; private set; }

        // ── Injected services (set by AppBootstrap) ──────────────────────────────
        private ICurrencyService  _currency;
        private ILevelService     _level;
        private IEconomyService   _economy;
        private ICareService      _care;
        private IHabitatService   _habitat;
        private IEnrichmentService _enrichment;
        private IAttractionService _attractions;
        private IQuestService     _quests;

        private bool _initialized;

        /// <summary>
        /// Injects all services. Called once from AppBootstrap after construction.
        /// </summary>
        public void Initialize(
            GameState          state,
            ICurrencyService   currency,
            ILevelService      level,
            IEconomyService    economy,
            ICareService       care,
            IHabitatService    habitat,
            IEnrichmentService enrichment,
            IAttractionService attractions,
            IQuestService      quests)
        {
            State        = state        ?? throw new ArgumentNullException(nameof(state));
            _currency    = currency     ?? throw new ArgumentNullException(nameof(currency));
            _level       = level        ?? throw new ArgumentNullException(nameof(level));
            _economy     = economy      ?? throw new ArgumentNullException(nameof(economy));
            _care        = care         ?? throw new ArgumentNullException(nameof(care));
            _habitat     = habitat      ?? throw new ArgumentNullException(nameof(habitat));
            _enrichment  = enrichment   ?? throw new ArgumentNullException(nameof(enrichment));
            _attractions = attractions  ?? throw new ArgumentNullException(nameof(attractions));
            _quests      = quests       ?? throw new ArgumentNullException(nameof(quests));
            _initialized = true;
        }

        /// <summary>
        /// Dispatches a command to the appropriate service in the ordered mutation pipeline.
        /// Only call from within the main thread.
        /// </summary>
        public void Apply(CommandBase cmd)
        {
            if (!_initialized)
            {
                Debug.LogError("[GameController] Apply called before Initialize.");
                return;
            }

            if (cmd == null)
            {
                Debug.LogWarning("[GameController] Apply received a null command.");
                return;
            }

            // TODO: Add command dispatch cases here as commands are defined.
            // Example pattern:
            // if (cmd is FeedAnimalCommand feed) { _care.DoAction(feed.Key, CareActionType.Feed); return; }
            Debug.LogWarning($"[GameController] Unhandled command type: {cmd.GetType().Name}");
        }

        /// <summary>
        /// Called every second by TickService. Grants gold income and drives care decay.
        /// </summary>
        public void Tick(float deltaSeconds, DateTime utcNow)
        {
            if (!_initialized) return;

            // Grant gold income for this tick.
            long gold = _economy.GoldPerSec();
            _currency.Grant(CurrencyType.Gold, gold);

            // Decay animal care meters.
            _care.Decay(deltaSeconds);
        }
    }
}
