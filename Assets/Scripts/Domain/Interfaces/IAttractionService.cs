namespace AWZ.Domain
{
    /// <summary>Fe4 — attraction builds. Level gate and duplicate guard enforced here.</summary>
    public interface IAttractionService
    {
        /// <summary>Returns true if the attraction with the given key has been built.</summary>
        bool IsBuilt(string attractionKey);

        /// <summary>Revenue multiplier: 1 + 0.12 * |built|</summary>
        float RevenueMult();

        /// <summary>Capacity multiplier: 1 + 0.15 * |built|</summary>
        float CapacityMult();

        /// <summary>
        /// Attempts to build the attraction with the given key.
        /// </summary>
        /// <returns>false if level&lt;unlockLevel, already built, or insufficient gold.</returns>
        bool Build(string attractionKey);
    }
}
