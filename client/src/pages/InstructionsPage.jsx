import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import { COMMON, STANDARD, ARCADE, OTHER } from '../features/simulator/hud/ControlsHelp.jsx';
import { rich } from '../i18n/rich.jsx';
import { useT } from '../i18n/index.js';

function Keys({ rows }) {
  const t = useT();
  return (
    <table className="key-table">
      <tbody>
        {rows.map(([key, action]) => (
          <tr key={key}>
            <th scope="row"><kbd>{t(key)}</kbd></th>
            <td>{t(action)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const Steps = ({ keys }) => {
  const t = useT();
  return (
    <ol className="plain-steps">
      {keys.map((k) => <li key={k}>{rich(t(k))}</li>)}
    </ol>
  );
};

export default function InstructionsPage() {
  const t = useT();
  return (
    <>
      <SiteHeader />
      <main className="page prose-page">
        <header className="page-head">
          <h1>{t('ins.title')}</h1>
          <p>{t('ins.lead')}</p>
        </header>

        <section aria-labelledby="first">
          <h2 id="first">{t('ins.first')}</h2>
          <Steps keys={['ins.f1', 'ins.f2', 'ins.f3', 'ins.f4']} />
        </section>

        <section aria-labelledby="keys">
          <h2 id="keys">{t('ins.keys')}</h2>
          <div className="two-col">
            <div>
              <h3>{t('ins.always')}</h3>
              <Keys rows={COMMON} />
              <h3>{t('ins.extras')}</h3>
              <Keys rows={OTHER} />
            </div>
            <div>
              <h3>{t('ins.standard')}</h3>
              <Keys rows={STANDARD} />
              <h3>{t('ins.arcade')}</h3>
              <p className="fine">{rich(t('ins.arcadeNote'))}</p>
              <Keys rows={ARCADE} />
            </div>
          </div>
        </section>

        <section aria-labelledby="autopilot">
          <h2 id="autopilot">{t('ins.ap')}</h2>
          <Steps keys={['ins.a1', 'ins.a2', 'ins.a3', 'ins.a4']} />
          <p>{t('ins.apNote')}</p>
        </section>

        <section aria-labelledby="sunrun">
          <h2 id="sunrun">{t('ins.ch')}</h2>
          <Steps keys={['ins.c1', 'ins.c2', 'ins.c3', 'ins.c4', 'ins.c5', 'ins.c6']} />
          <p className="more"><Link className="btn primary" to="/challenge/1">{t('home.race')}</Link></p>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits">{t('ins.know')}</h2>
          <ul className="plain-list">
            {['ins.k1', 'ins.k2', 'ins.k3'].map((k) => <li key={k}>{rich(t(k))}</li>)}
          </ul>
          <p className="more"><Link className="btn primary large" to="/simulator/1">{t('home.openSim')}</Link></p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
