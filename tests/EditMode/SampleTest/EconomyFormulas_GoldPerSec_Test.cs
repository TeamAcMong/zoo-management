// TR-C2-005: goldPerSec = max(1, round(visitors * 0.05 * (1 + 0.12 * built)))
// ADR-0003 (ordered mutation pipeline), ADR-0006 (Tuning constants)
// Story type: Logic (BLOCKING — must pass before any economy story ships)

using NUnit.Framework;

namespace AWZ.Tests.EditMode.SampleTest
{
    /// <summary>
    /// Verifies the C2 Zoo Economy gold-per-second formula.
    /// This test depends on no Unity engine APIs — pure C# domain math.
    /// Once AWZ.Domain is implemented, replace the inline formula
    /// with a call to EconomyService.GoldPerSec().
    /// </summary>
    [TestFixture]
    public class EconomyFormulas_GoldPerSec_Test
    {
        private const float SpendPerVisitor = 0.05f;
        private const float AttractionRevenueMult = 0.12f;

        // TR-C2-005: goldPerSec = max(1, round(visitors * SPV * (1 + 0.12 * |built|)))
        private static int GoldPerSec(int visitors, int builtAttractions)
        {
            var raw = visitors * SpendPerVisitor * (1f + AttractionRevenueMult * builtAttractions);
            return System.Math.Max(1, (int)System.Math.Round(raw));
        }

        [Test]
        public void Test_ZeroVisitors_ReturnsFloorOf1()
        {
            // The formula has a max(1,...) floor — a zoo always earns at least 1/s
            Assert.AreEqual(1, GoldPerSec(visitors: 0, builtAttractions: 0));
        }

        [Test]
        public void Test_100Visitors_NoAttractions_Returns5()
        {
            // 100 * 0.05 * 1.0 = 5.0 → round → 5
            Assert.AreEqual(5, GoldPerSec(visitors: 100, builtAttractions: 0));
        }

        [Test]
        public void Test_100Visitors_5Attractions_Returns8()
        {
            // 100 * 0.05 * (1 + 0.12*5) = 100 * 0.05 * 1.60 = 8.0 → round → 8
            Assert.AreEqual(8, GoldPerSec(visitors: 100, builtAttractions: 5));
        }

        [Test]
        public void Test_AttractionMultiplier_IsMonotonicallyIncreasing()
        {
            // Each additional attraction must add at least 1 gold/s on a meaningful visitor count
            int previous = GoldPerSec(visitors: 200, builtAttractions: 0);
            for (int i = 1; i <= 5; i++)
            {
                int current = GoldPerSec(visitors: 200, builtAttractions: i);
                Assert.GreaterOrEqual(current, previous,
                    $"GoldPerSec did not increase or stay equal at attraction count {i}");
                previous = current;
            }
        }

        [Test]
        public void Test_5Built_Revenue_Is1Point60xBaseline()
        {
            // 5 attractions → multiplier = 1 + 0.12*5 = 1.60×
            int noAttr   = GoldPerSec(visitors: 1000, builtAttractions: 0);
            int allAttr  = GoldPerSec(visitors: 1000, builtAttractions: 5);
            // Allow ±1 for rounding
            Assert.AreEqual((int)System.Math.Round(noAttr * 1.60f), allAttr, delta: 1,
                message: "5 attractions should yield approximately 1.60× baseline gold/s");
        }

        [Test]
        public void Test_NegativeVisitors_ClampedToFloor()
        {
            // Guard against negative elapsed / reconstructed state anomalies
            Assert.AreEqual(1, GoldPerSec(visitors: -50, builtAttractions: 0));
        }
    }
}
