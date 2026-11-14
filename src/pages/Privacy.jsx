import { useStore, useToast } from '../store.jsx'
import { Badge, Button, Card, Notice, PageHeader } from '../ui.jsx'

const S = ({ title, children }) => (
  <section className="mt-6">
    <h2 className="text-lg font-bold">{title}</h2>
    <div className="mt-1 space-y-2 text-muted">{children}</div>
  </section>
)

export default function Privacy() {
  const { state, dispatch, consent, setConsent } = useStore()
  const { toast } = useToast()
  const status = consent === 'granted' ? ['success', 'Saving allowed'] : consent === 'declined' ? ['neutral', 'Saving off'] : ['warn', 'Not chosen yet']
  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <PageHeader title="Privacy policy" subtitle="Plain-language version. Last updated November 14, 2026." />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Your data choices</h2>
          <Badge tone={status[0]}>{status[1]}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">KinBridge asks your permission before saving anything. Your choice applies to this browser only.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {consent !== 'granted' && <Button onClick={() => (setConsent('granted'), toast('Saving allowed. Your entries will be remembered in this browser.'))}>Allow saving in this browser</Button>}
          {consent === 'granted' && (
            <Button variant="danger" onClick={() => (setConsent('declined'), toast('Saving stopped and saved data deleted. This session stays in memory only.'))}>
              Stop saving &amp; delete my data
            </Button>
          )}
          {state && (
            <Button variant="secondary" onClick={() => (dispatch({ type: 'clear' }), toast('All data cleared.'), (window.location.hash = '/'))}>
              Clear all data now
            </Button>
          )}
        </div>
      </Card>

      <Notice tone="warn" className="mt-4">
        This is a hackathon prototype. This policy describes how the prototype works today and isn’t legal advice. KinBridge is <strong>not HIPAA compliant</strong> and should not be used for medical records.
      </Notice>

      <S title="What KinBridge collects">
        <p>Only what you type: first names, a city/ZIP, budget numbers, expenses, tasks, medication <em>labels</em> and monthly prices, family-split amounts, and check-in notes. In demo mode, everything is fictional sample data you can edit.</p>
        <p>We never ask for Social Security numbers, Medicare or insurance member numbers, full birth dates, or medical records. Please don’t type them into notes.</p>
      </S>
      <S title="Where it is stored">
        <p>In your browser’s local storage on this device, and only if you choose “Allow”. KinBridge has no server, no database, and no accounts. Nothing you enter is uploaded, sold, or shared. If you choose not to save, nothing is stored and refreshing resets the app.</p>
      </S>
      <S title="What we don’t do">
        <ul className="list-disc space-y-1 pl-5">
          <li>No advertising, analytics, tracking pixels, or third-party cookies.</li>
          <li>No selling or sharing of data. There is no one for us to share it with.</li>
          <li>No real payment processing. Checkout is a demo and collects no card details.</li>
          <li>The pharmacy “map” is drawn on your device. No location is requested from your browser and no map service is called.</li>
        </ul>
      </S>
      <S title="Support messages">
        <p>If you use Support, your message is saved on this device. It leaves your device only if you press “Send by email”, which opens <em>your</em> email app with the text pre-filled. You decide whether to send it and whether to include a plan summary.</p>
      </S>
      <S title="Links to other sites">
        <p>Resources link to public websites (for example Medicare.gov and Eldercare Locator). Those sites have their own privacy practices.</p>
      </S>
      <S title="Your controls">
        <p>You can withdraw permission, delete saved data, or clear everything at any time using the buttons above or “Clear demo data” in the header. Deleting data can’t be undone.</p>
      </S>
      <S title="Children">
        <p>KinBridge is for adults. It is not directed to children under 13.</p>
      </S>
      <S title="Changes and contact">
        <p>If this policy changes, the date above will change. Questions? Use the <a className="font-semibold text-brand-700 underline" href="#/support">Support page</a>.</p>
      </S>
    </div>
  )
}
