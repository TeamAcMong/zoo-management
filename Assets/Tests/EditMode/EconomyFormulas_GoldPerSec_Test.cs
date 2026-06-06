// TR-C2-005: goldPerSec = max(1, round(visitors * 0.05 * (1 + 0.12 * built)))
// ADR-0003 (ordered mutation pipeline), ADR-0006 (Tuning constants)
// Story type: Logic (BLOCKING — must pass before any economy story ships)
//
// This is a SELF-CONTAINED pipeline-proving test: it has no dependency on the
// AWZ.Domain assembly (which does not exist yet). It verifies the C2 economy
// formula inline so CI is green from day one. Once AWZ.Domain.EconomyService
// is implemented, add "AWZ.Domain" to this asmdef's references and replace the
// inline GoldPerSec() with a call to the real service.

using NUnit.Framework;

namespace AWZ.Tests.EditMode
{
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
            Assert.AreEqual(1, GoldPerSec(visitors: 0, builtAttractions: 0));
        }

        [Test]
        public void Test_100Visitors_NoAttractions_Returns5()
        {
            // 100 * 0.05 * 1.0 = 5.0 -> round -> 5
            Assert.AreEqual(5, GoldPerSec(visitors: 100, builtAttractions: 0));
        }

        [Test]
        public void Test_100Visitors_5Attractions_Returns8()
        {
            // 100 * 0.05 * (1 + 0.12*5) = 100 * 0.05 * 1.60 = 8.0 -> round -> 8
            Assert.AreEqual(8, GoldPerSec(visitors: 100, builtAttractions: 5));
        }

        [Test]
        public void Test_AttractionMultiplier_IsMonotonicallyIncreasing()
        {
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
        public void Test_NegativeVisitors_ClampedToFloor()
        {
            Assert.AreEqual(1, GoldPerSec(visitors: -50, builtAttractions: 0));
        }
    }
}
