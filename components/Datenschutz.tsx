import React from 'react';
import Card from './Card';

const Datenschutz: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Datenschutzerklärung</h1>
      
      <Card>
        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Verantwortliche Stelle</h2>
            <p className="text-gray-700">
              Kinderhaus St. Wolfgang<br />
              [Adresse]<br />
              [PLZ Ort]<br />
              E-Mail: [Email-Adresse]<br />
              Telefon: [Telefonnummer]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p className="text-gray-700 mb-2">
              Wir erheben und verarbeiten folgende personenbezogene Daten über unser Elternportal:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li><strong>Benutzer-Daten:</strong> Name, Benutzername, E-Mail-Adresse, verschlüsseltes Passwort</li>
              <li><strong>Kinder-Daten:</strong> Name des Kindes, Gruppenzugehörigkeit</li>
              <li><strong>Gesundheitsdaten:</strong> Krankheitssymptome und Abwesenheitsgründe (nur wenn von Ihnen gemeldet)</li>
              <li><strong>Kommunikationsdaten:</strong> Nachrichten zwischen Eltern und Kita-Personal</li>
              <li><strong>Nutzungsdaten:</strong> Anmeldezeitpunkte, letzte Aktivität</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Zweck der Datenverarbeitung</h2>
            <p className="text-gray-700 mb-2">
              Die Verarbeitung Ihrer personenbezogenen Daten erfolgt zu folgenden Zwecken:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Verwaltung der Betreuungsverhältnisse</li>
              <li>Kommunikation zwischen Eltern und Kita-Personal</li>
              <li>Information über Veranstaltungen und wichtige Mitteilungen</li>
              <li>Abwesenheitsmeldungen und Ferienbetreuungsplanung</li>
              <li>Bereitstellung von relevanten Dokumenten und Formularen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Rechtsgrundlage</h2>
            <p className="text-gray-700">
              Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage von:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
              <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
              <li>Art. 9 Abs. 2 lit. a DSGVO (Einwilligung für Gesundheitsdaten)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Datensicherheit</h2>
            <p className="text-gray-700">
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen 
              zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den Zugriff unberechtigter 
              Personen zu schützen:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1 mt-2">
              <li>Verschlüsselte HTTPS-Verbindung</li>
              <li>Passwörter werden mit bcrypt gehashed und niemals im Klartext gespeichert</li>
              <li>Zugriffskontrollen und rollenbasierte Berechtigungen</li>
              <li>Regelmäßige Sicherheitsupdates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Speicherdauer</h2>
            <p className="text-gray-700">
              Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die Erfüllung der 
              Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen. Nach Beendigung 
              des Betreuungsverhältnisses werden die Daten gelöscht, sofern keine gesetzlichen 
              Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Cookies und localStorage</h2>
            <p className="text-gray-700">
              Unsere Anwendung verwendet <strong>keine Cookies</strong>. Zur Authentifizierung speichern 
              wir ein JSON Web Token (JWT) im localStorage Ihres Browsers. Dieses Token wird ausschließlich 
              lokal in Ihrem Browser gespeichert und dient der Aufrechterhaltung Ihrer Login-Session.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Ihre Rechte</h2>
            <p className="text-gray-700 mb-2">Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
              <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Unrichtige Daten können Sie korrigieren lassen</li>
              <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen</li>
              <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem strukturierten Format erhalten</li>
              <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an die Kita-Leitung oder nutzen Sie die 
              Kontaktdaten unter Punkt 1.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Datenexport</h2>
            <p className="text-gray-700">
              Als Elternteil können Sie jederzeit einen Export Ihrer persönlichen Daten anfordern. 
              Dieser enthält alle zu Ihnen und Ihren Kindern gespeicherten Informationen im JSON-Format.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Beschwerderecht</h2>
            <p className="text-gray-700">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung 
              Ihrer personenbezogenen Daten durch uns zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Änderungen der Datenschutzerklärung</h2>
            <p className="text-gray-700">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte 
              Rechtslagen oder Änderungen des Dienstes anzupassen. Die jeweils aktuelle 
              Datenschutzerklärung finden Sie stets auf dieser Seite.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-6">
            Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Datenschutz;
