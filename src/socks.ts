type Component = {
  attr: string
  fileName: string
}

(function () {
  // const base = 'http://localhost:5173/src/components/' // For local development
  const base = 'https://unpkg.com/socks-ui@latest/dist/' // For production
  // const extension = '.ts' // For local development
  const extension = '.js' // For production

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
