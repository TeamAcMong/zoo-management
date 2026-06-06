namespace AWZ.Domain
{
    /// <summary>Care meters for one animal (C1). All values 0–100.</summary>
    public sealed class AnimalMeters
    {
        public float Hunger   { get; set; } = 80f;
        public float Thirst   { get; set; } = 80f;
        public float Clean    { get; set; } = 80f;
        public float Happy    { get; set; } = 80f;
        public float Trust    { get; set; } = 0f;
    }
}
