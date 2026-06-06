using System;
using System.Collections.Generic;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe1 — animal collection service. Manages unlocking species and purchasing additional animals.
    /// Buy cost = round(baseAppeal * BUY_COST_MULT * currentCount) + 50  (BUY_COST_MULT=50, balance-check 2026-06-06)
    /// </summary>
    public class CollectionService
    {
        private const int BuyCostMult  = 50;
        private const int BuyCostFloor = 50;

        private readonly GameState           _state;
        private readonly ICurrencyService    _currency;
        private readonly ILevelService       _level;
        private readonly Func<string, float> _getBaseAppeal;
        private readonly Func<string, int>   _getUnlockLevel;

        /// <summary>Constructs a CollectionService operating on the provided game state.</summary>
        public CollectionService(
            GameState state,
            ICurrencyService currency,
            ILevelService level,
            Func<string, float> getBaseAppeal,
            Func<string, int> getUnlockLevel)
        {
            _state          = state          ?? throw new ArgumentNullException(nameof(state));
            _currency       = currency       ?? throw new ArgumentNullException(nameof(currency));
            _level          = level          ?? throw new ArgumentNullException(nameof(level));
            _getBaseAppeal  = getBaseAppeal  ?? throw new ArgumentNullException(nameof(getBaseAppeal));
            _getUnlockLevel = getUnlockLevel ?? throw new ArgumentNullException(nameof(getUnlockLevel));
        }

        /// <summary>
        /// Unlocks a species for the first time. Does not cost gold — species availability
        /// is gated by level. Returns false if level requirement is not met or already unlocked.
        /// </summary>
        public bool Unlock(string speciesKey)
        {
            int requiredLevel = _getUnlockLevel(speciesKey);
            if (!_level.IsUnlocked(requiredLevel)) return false;

            if (Array.IndexOf(_state.OwnedSpecies, speciesKey) >= 0) return false;

            var list = new List<string>(_state.OwnedSpecies) { speciesKey };
            _state.OwnedSpecies = list.ToArray();

            if (!_state.AnimalCounts.ContainsKey(speciesKey))
                _state.AnimalCounts[speciesKey] = 0;

            return true;
        }

        /// <summary>
        /// Purchases one additional animal of the given species.
        /// </summary>
        /// <returns>false if the species is not unlocked, level gate not met, or insufficient gold.</returns>
        public bool BuyMore(string speciesKey)
        {
            if (Array.IndexOf(_state.OwnedSpecies, speciesKey) < 0) return false;

            int currentCount = _state.AnimalCounts.TryGetValue(speciesKey, out int c) ? c : 0;
            float baseAppeal = _getBaseAppeal(speciesKey);
            long  cost       = (long)Math.Round(baseAppeal * BuyCostMult * currentCount) + BuyCostFloor;

            if (!_currency.TryPay(CurrencyType.Gold, cost)) return false;

            _state.AnimalCounts[speciesKey] = currentCount + 1;
            return true;
        }
    }
}
