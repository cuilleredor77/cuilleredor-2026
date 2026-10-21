// Version anglaise du site : la balise <html> vient du layout racine (lang="fr"), on la passe en anglais.
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.lang="en"' }} />
      {children}
    </>
  );
}
