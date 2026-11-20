// Shown when a service behind the gateway isn't running or isn't built yet
function ServiceNotice({ service, children }) {
    return (
      <div className="service-notice" role="status">
        <strong>{service} is not connected yet.</strong>
        {children && <span> {children}</span>}
      </div>
    )
  }
  
  export default ServiceNotice