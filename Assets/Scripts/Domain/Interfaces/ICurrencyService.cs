namespace AWZ.Domain
{
    /// <summary>F2 — atomic currency operations. No negative balance. Animals never payable in Gems.</summary>
    public interface ICurrencyService
    {
        /// <summary>Returns the current balance for the given currency type.</summary>
        long Balance(CurrencyType t);

        /// <summary>
        /// Attempts to deduct <paramref name="amount"/> of currency <paramref name="t"/>.
        /// </summary>
        /// <returns>false if insufficient; never partially deducts.</returns>
        bool TryPay(CurrencyType t, long amount);

        /// <summary>Adds <paramref name="amount"/> to the currency balance. Always succeeds.</summary>
        void Grant(CurrencyType t, long amount);
    }
}
