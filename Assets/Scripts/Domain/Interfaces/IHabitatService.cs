namespace AWZ.Domain
{
    /// <summary>Fe2 — enclosure upgrade. Cap (encLv≤5) enforced here.</summary>
    public interface IHabitatService
    {
        /// <summary>Returns the current enclosure level (1–5) for the given species key.</summary>
        int EnclosureLevel(string speciesKey);

        /// <summary>
        /// Attempts to upgrade the enclosure for the given species.
        /// </summary>
        /// <returns>false if encLv≥5 or insufficient gold.</returns>
        bool Upgrade(string speciesKey);
    }
}
