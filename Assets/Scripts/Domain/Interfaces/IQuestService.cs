namespace AWZ.Domain
{
    /// <summary>Fe6 — quest progression. Bump on completion; claim idempotency via HashSet.</summary>
    public interface IQuestService
    {
        /// <summary>Increments the internal counter for the given counter type, advancing quest steps.</summary>
        void Bump(CounterType counter);

        /// <summary>
        /// Claims rewards for the given quest ID.
        /// </summary>
        /// <returns>false if already claimed (idempotency guard).</returns>
        bool Claim(string questId);
    }
}
