using UnityEngine;
using UnityEngine.UIElements;
using AWZ.Runtime;

namespace AWZ.UI
{
    /// <summary>Base class for all UI Toolkit screen controllers.</summary>
    [RequireComponent(typeof(UIDocument))]
    public abstract class ScreenBase : MonoBehaviour, IGameScreen
    {
        protected UIDocument     Document   { get; private set; }
        protected VisualElement  Root       { get; private set; }
        protected GameController Controller { get; private set; }

        protected virtual void Awake()
        {
            Document = GetComponent<UIDocument>();
            Root     = Document.rootVisualElement;
        }

        /// <summary>
        /// Called once after all services are ready (from AppBootstrap, via IGameScreen).
        /// Override to subscribe to events and render the initial state — call base first.
        /// </summary>
        public virtual void Initialize(GameController controller)
        {
            Controller = controller;
        }

        public virtual void Show() => Root.style.display = DisplayStyle.Flex;
        public virtual void Hide() => Root.style.display = DisplayStyle.None;
    }
}
