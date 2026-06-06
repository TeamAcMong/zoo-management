using System;

namespace AWZ.Domain
{
    /// <summary>Published when the player crosses a level threshold.</summary>
    public sealed class LevelUpEvent
    {
        public int NewLevel;
    }

    /// <summary>
    /// C3 — XP accumulation and level derivation. Derives level from a piecewise-linear
    /// XP table with 7 anchor points. Level is monotonically non-decreasing.
    /// </summary>
    public class LevelService : ILevelService
    {
        public const int MaxLevel = 92;

        private readonly GameState _state;
        private readonly EventBus  _bus;

        // Anchor points: (level, cumulativeXp). Linearly interpolated between anchors.
        private static readonly (int Level, long Xp)[] LevelAnchors =
        {
            (1,  0),
            (7,  5_200),
            (18, 42_000),
            (30, 210_000),
            (45, 980_000),
            (60, 3_600_000),
            (84, 18_000_000),
        };

        /// <summary>Constructs a LevelService operating on the provided game state and event bus.</summary>
        public LevelService(GameState state, EventBus bus)
        {
            _state = state ?? throw new ArgumentNullException(nameof(state));
            _bus   = bus   ?? throw new ArgumentNullException(nameof(bus));
        }

        /// <inheritdoc/>
        public int Level => _state.Level;

        /// <inheritdoc/>
        public void AddXp(long n)
        {
            if (n <= 0) return;

            _state.Xp += (int)n;

            int derived = DeriveLevel(_state.Xp);
            if (derived > _state.Level)
            {
                _state.Level = derived;
                _bus.Publish(new LevelUpEvent { NewLevel = _state.Level });
            }
        }

        /// <inheritdoc/>
        public bool IsUnlocked(int requiredLevel) => _state.Level >= requiredLevel;

        /// <summary>
        /// Derives the level from total accumulated XP using the piecewise-linear anchor table.
        /// Returns a value in [1, MaxLevel].
        /// </summary>
        private static int DeriveLevel(long totalXp)
        {
            if (totalXp <= 0) return 1;

            // Walk anchors to find which segment totalXp falls in.
            for (int i = LevelAnchors.Length - 1; i >= 0; i--)
            {
                if (totalXp >= LevelAnchors[i].Xp)
                {
                    // If this is the last anchor, extrapolate beyond it toward MaxLevel.
                    if (i == LevelAnchors.Length - 1)
                    {
                        long xpAtLast  = LevelAnchors[i].Xp;
                        int  lvAtLast  = LevelAnchors[i].Level;
                        int  lvRange   = MaxLevel - lvAtLast;
                        // Use the XP-per-level rate of the final segment extended to MaxLevel.
                        // Final segment: anchors[6] (lv84, 18M) - anchors[5] (lv60, 3.6M)
                        long xpPrevSeg = LevelAnchors[i].Xp - LevelAnchors[i - 1].Xp;
                        int  lvPrevSeg = LevelAnchors[i].Level - LevelAnchors[i - 1].Level;
                        long xpPerLv   = xpPrevSeg / lvPrevSeg;
                        if (xpPerLv <= 0) xpPerLv = 1;
                        int extra = (int)Math.Min((totalXp - xpAtLast) / xpPerLv, lvRange);
                        return Math.Min(lvAtLast + extra, MaxLevel);
                    }

                    // Interpolate between anchors[i] and anchors[i+1].
                    long xpLow  = LevelAnchors[i].Xp;
                    long xpHigh = LevelAnchors[i + 1].Xp;
                    int  lvLow  = LevelAnchors[i].Level;
                    int  lvHigh = LevelAnchors[i + 1].Level;

                    double fraction = (double)(totalXp - xpLow) / (xpHigh - xpLow);
                    int    level    = lvLow + (int)Math.Floor(fraction * (lvHigh - lvLow));
                    return Math.Clamp(level, 1, MaxLevel);
                }
            }

            return 1;
        }
    }
}
