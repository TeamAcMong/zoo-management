using System;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe7 — offline income reconciliation. Computes pending gold from the time the app was closed
    /// at 60% of the live rate, capped at 8 hours of accumulation.
    /// </summary>
    public class IdleService
    {
        private const double OfflineRateFactor  = 0.60;
        private const double OfflineCapSeconds  = 28_800.0; // 8 hours

        private readonly GameState        _state;
        private readonly IEconomyService  _economy;
        private readonly ICurrencyService _currency;

        /// <summary>Constructs an IdleService operating on the provided game state.</summary>
        public IdleService(GameState state, IEconomyService economy, ICurrencyService currency)
        {
            _state    = state    ?? throw new ArgumentNullException(nameof(state));
            _economy  = economy  ?? throw new ArgumentNullException(nameof(economy));
            _currency = currency ?? throw new ArgumentNullException(nameof(currency));
        }

        /// <summary>
        /// Computes offline gold earned since <see cref="GameState.ClosedAtUtc"/>.
        /// Applies 60% rate factor and caps at 8 hours. Result is stored in
        /// <see cref="GameState.OfflinePendingGold"/> but NOT yet granted.
        /// </summary>
        /// <returns>The pending gold amount (same value stored in state).</returns>
        public long ComputeOffline(DateTime now)
        {
            double elapsed = (now - _state.ClosedAtUtc).TotalSeconds;
            if (elapsed <= 0.0) return 0L;

            double capped        = Math.Min(elapsed, OfflineCapSeconds);
            long   goldPerSec    = _economy.GoldPerSec();
            long   pendingGold   = (long)Math.Floor(capped * goldPerSec * OfflineRateFactor);

            _state.OfflinePendingGold = pendingGold;
            return pendingGold;
        }

        /// <summary>
        /// Grants all pending offline gold to the player and resets the pending amount to zero.
        /// </summary>
        public void CollectPending()
        {
            if (_state.OfflinePendingGold <= 0L) return;

            _currency.Grant(CurrencyType.Gold, _state.OfflinePendingGold);
            _state.OfflinePendingGold = 0L;
        }
    }
}
