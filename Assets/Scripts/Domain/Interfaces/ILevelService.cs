namespace AWZ.Domain
{
    /// <summary>C3 — XP accumulation and level derivation.</summary>
    public interface ILevelService
    {
        /// <summary>Current player level in range 1..92; MAX_LEVEL guarded.</summary>
        int Level { get; }

        /// <summary>
        /// Adds XP monotonically. Publishes a LevelUp event if the level threshold is crossed.
        /// </summary>
        void AddXp(long n);

        /// <summary>Returns true if the current level meets or exceeds <paramref name="requiredLevel"/>.</summary>
        bool IsUnlocked(int requiredLevel);
    }
}
