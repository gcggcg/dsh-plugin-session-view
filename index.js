/**
 * Host half of the session plugin view bundle.
 *
 * The panel is rendered entirely by the Client module, which reads the Host
 * plugin inventory through the existing `pluginInventory/list` Remote and the
 * per-session skill catalog through `skills/list`. This half therefore owns no
 * Host state; it exists so the bundle resolves as one Loader row.
 *
 * @module @local/session-plugin-view
 */

/** No Host-side resources are owned by this bundle. */
export function apply() {}
