const PROVIDER_IMG = "https://image.tmdb.org/t/p/w45";

const GROUPS = [
  { key: "flatrate", label: "Stream" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

export default function WatchProviders({ providers, region }) {
  if (!providers) {
    return (
      <p className="watchProvidersEmpty">
        No streaming info for {region}. Try another region if you travel often.
      </p>
    );
  }

  const hasAny = GROUPS.some(({ key }) => providers[key]?.length);

  if (!hasAny) {
    return (
      <p className="watchProvidersEmpty">
        Not available to stream, rent, or buy in {region} yet.
      </p>
    );
  }

  return (
    <div className="watchProvidersGroups">
      {GROUPS.map(({ key, label }) => {
        const list = providers[key];
        if (!list?.length) return null;

        return (
          <div key={key} className="watchProviderGroup">
            <h4 className="watchProviderLabel">{label}</h4>
            <div className="watchProviderList">
              {list.map((p) => (
                <div key={`${key}-${p.provider_id}`} className="watchProviderChip">
                  {p.logo_path ? (
                    <img
                      src={`${PROVIDER_IMG}${p.logo_path}`}
                      alt=""
                      className="watchProviderLogo"
                    />
                  ) : null}
                  <span>{p.provider_name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {providers.link ? (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="watchProviderLink"
        >
          View all options on TMDB →
        </a>
      ) : null}
    </div>
  );
}
