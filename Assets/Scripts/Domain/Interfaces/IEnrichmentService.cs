namespace AWZ.Domain
{
    /// <summary>Fe3 — enrichment. Cap (enrLv≤5) enforced here.</summary>
    public interface IEnrichmentService
    {
        /// <summary>Returns the current enrichment level (0–5) for the given species key.</summary>
        int EnrichmentLevel(string speciesKey);

        /// <summary>
        /// Attempts to add enrichment for the given species.
        /// </summary>
        /// <returns>false if enrLv≥5 or insufficient gold.</returns>
        bool AddEnrichment(string speciesKey);
    }
}
