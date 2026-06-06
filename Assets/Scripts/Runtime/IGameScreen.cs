namespace AWZ.Runtime
{
    /// <summary>
    /// Implemented by every UI screen controller so the composition root
    /// (<see cref="AppBootstrap"/>) can initialize screens without the AWZ.Runtime
    /// assembly referencing AWZ.UI — that would be a circular dependency, since
    /// AWZ.UI already references AWZ.Runtime. Screens are discovered by this
    /// interface at boot. (Dependency-inversion: Runtime defines the contract,
    /// UI implements it.)
    /// </summary>
    public interface IGameScreen
    {
        /// <summary>
        /// Called once after all services are wired. The controller exposes game
        /// state and the command/event entry points the screen subscribes to.
        /// </summary>
        void Initialize(GameController controller);
    }
}
