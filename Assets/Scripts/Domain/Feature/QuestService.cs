using System;
using System.Collections.Generic;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe6 — quest progression service. Tracks counter bumps and provides idempotent claim.
    /// Stub reward values will be replaced once QuestDef data is wired from the Data layer.
    /// </summary>
    public class QuestService : IQuestService
    {
        // Stub reward values — will be replaced by QuestDef data.
        private const long StubGoldReward = 500L;
        private const int  StubXpReward   = 50;

        private readonly GameState        _state;
        private readonly ICurrencyService _currency;
        private readonly ILevelService    _level;

        private readonly Dictionary<CounterType, int> _counters = new Dictionary<CounterType, int>();

        /// <summary>Constructs a QuestService operating on the provided game state.</summary>
        public QuestService(GameState state, ICurrencyService currency, ILevelService level)
        {
            _state    = state    ?? throw new ArgumentNullException(nameof(state));
            _currency = currency ?? throw new ArgumentNullException(nameof(currency));
            _level    = level    ?? throw new ArgumentNullException(nameof(level));
        }

        /// <inheritdoc/>
        public void Bump(CounterType counter)
        {
            if (_counters.TryGetValue(counter, out int current))
                _counters[counter] = current + 1;
            else
                _counters[counter] = 1;
        }

        /// <inheritdoc/>
        public bool Claim(string questId)
        {
            if (_state.ClaimedQuestIds.Contains(questId)) return false;

            _state.ClaimedQuestIds.Add(questId);

            // Grant stub rewards — replace with QuestDef data when available.
            _currency.Grant(CurrencyType.Gold, StubGoldReward);
            _level.AddXp(StubXpReward);

            return true;
        }
    }
}
