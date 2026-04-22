export default function AuthErrorPage() {
  return (
    <div className="py-30 flex items-center justify-center text-center p-10">
      <div>
        <h1 className="text-3xl font-black mb-4">Erreur de connexion</h1>
        <p className="text-zinc-500 mb-6">
          Le lien de connexion est invalide ou expiré.
        </p>
        <a
          href="https://indian-nepaliswad.fr"
          className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
