import { addSource } from "@/app/admin/actions";

/** Collapsed until needed: the source list is the page, adding one is occasional. */
export function AddSource() {
  return (
    <details className="add-source">
      <summary className="btn primary">+ Agregar fuente</summary>
      <form action={addSource} className="add-form">
        <label>
          <span>URL</span>
          <input
            name="url"
            placeholder="luma.com/calendario · luma.com/user/… · luma.com/evento · meetup.com/… · eventbrite.com/o/…"
            required
          />
        </label>
        <label>
          <span>Nombre</span>
          <input name="name" placeholder="Opcional" />
        </label>
        <label>
          <span>API key de Luma</span>
          <input name="apiKey" type="password" placeholder="Opcional, para calendarios privados" autoComplete="off" />
        </label>
        <fieldset className="segment-input">
          <legend>Alcance</legend>
          <label>
            <input type="radio" name="scope" value="global" defaultChecked />
            <span>Global</span>
          </label>
          <label>
            <input type="radio" name="scope" value="latam" />
            <span>LATAM</span>
          </label>
        </fieldset>
        <button className="btn primary" type="submit">
          Agregar
        </button>
      </form>
    </details>
  );
}
