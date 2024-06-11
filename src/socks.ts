type Component = {
  attr: string
  fileName: string
}

(function () {
  // 
  let base = 'https://unpkg.com/socks-ui@latest/dist/' // For production
  let extension = '.js' // For production
  if (window.location.hostname === 'localhost') {
    base = 'http://localhost:5173/src/components/' // For local development
    extension = '.ts' // For local development
  }


  const components: Component[] = [
    {
      attr: "s-accordion",
      fileName: "accordion"
    },
    {
      attr: "s-modal",
      fileName: "modal"
    }
  ]

  function loadComponent(component: Component) {
    const script = document.createElement('script')
    script.src = base + component.fileName + extension
    script.async = true
    document.head.appendChild(script)
  }

  // Check for components in the DOM 
  components.forEach(component => {
    if (!document.querySelector(`[${component.attr}]`)) return
    loadComponent(component)
  })
})()
