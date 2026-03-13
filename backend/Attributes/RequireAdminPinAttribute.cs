namespace AirAware.Attributes;

/// <summary>
/// Markiert einen Endpoint als Admin-geschützt – erfordert einen gültigen PIN im Header.
/// Header: X-Admin-Pin
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireAdminPinAttribute : Attribute;
