namespace AirAware.Attributes;

/// <summary>
/// Markiert einen Endpoint als geschützt – erfordert einen gültigen API-Key im Header.
/// Header: X-Api-Key
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireApiKeyAttribute : Attribute;
