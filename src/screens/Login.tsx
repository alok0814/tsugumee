import type { FormEvent } from "react";

export function Login({ onEnter }: { onEnter: () => void }) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onEnter();
  }

  return (
    <div className="login-screen">
      <img className="logo-hero" src="/logo.png" alt="つぎミー" />
      <form className="login" onSubmit={onSubmit}>
        <p className="quiet">ログインの見た目だけです。認証は今回入れていません。</p>
      <label htmlFor="mail">メール</label>
      <input id="mail" type="email" name="email" autoComplete="username" defaultValue="hayashi@example.com" />
      <label htmlFor="pass">パスワード</label>
      <input id="pass" type="password" name="password" autoComplete="current-password" defaultValue="password" />
      <button type="submit" className="primary">
        ログイン
      </button>
      </form>
    </div>
  );
}
