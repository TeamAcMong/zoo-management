namespace AWZ.Domain
{
    /// <summary>C2 — pure derivation from current state (no mutations).</summary>
    public interface IEconomyService
    {
        /// <summary>goldPerSec = max(1, round(visitors * 0.05 * (1 + 0.12 * built)))</summary>
        long GoldPerSec();

        /// <summary>Total visitor capacity derived from enclosure levels and attraction multipliers.</summary>
        long Capacity();

        /// <summary>Appeal score for the given species key, factoring enclosure and enrichment levels.</summary>
        double AppealOf(string speciesKey);
    }
}
