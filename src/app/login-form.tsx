"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveParticipant, type ParticipantState } from "./participant-action";

const initialState: ParticipantState = { status: "idle", message: "" };

export default function LoginForm() {
  const router = useRouter();
  const prepared = useRef(false);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);
  const [state, formAction, pending] = useActionState(saveParticipant, initialState);
  const canSubmit = allFieldsFilled && !pending;
  return (
    <main>
      <div className="login-container">
        <div className="login-card">
          <div className="login-app-name-container">
            <div className="login-app-logo">
              <h1>
                <span className="text-top">Top</span>
                <span className="text-o">O</span>
                <span className="text-rme">RME</span>
              </h1>
            </div>
            <h1>Topological Sort Worksheet</h1>
          </div>
          <form
            action={formAction}
            className="login-form"
            onFocus={(event) => {
              if (prepared.current || !(event.target instanceof HTMLInputElement)) return;
              prepared.current = true;
              router.prefetch("/consent-form");
              void fetch("/api/participant/prepare", { method: "POST" }).catch(() => {});
            }}
            onChange={(event) => {
              const fields = new FormData(event.currentTarget);
              setAllFieldsFilled(
                ["namaLengkap", "npm", "email"].every(
                  (name) => String(fields.get(name) ?? "").trim().length > 0
                )
              );
            }}
          >
            <div className="login-fields">
              <div className="login-field">
                <label htmlFor="nama-lengkap">Nama Lengkap</label>
                <input
                  type="text"
                  id="nama-lengkap"
                  name="namaLengkap"
                  defaultValue={state.fields?.namaLengkap}
                  maxLength={200}
                  placeholder="Nama Lengkap"
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="npm">NPM</label>
                <input
                  type="text"
                  id="npm"
                  name="npm"
                  defaultValue={state.fields?.npm}
                  maxLength={50}
                  placeholder="0123456789"
                  required
                />
              </div>
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={state.fields?.email}
                  maxLength={254}
                  placeholder="email@email.com"
                  required
                />
              </div>
            </div>
            {state.message && (
              <p role="alert">
                {state.message}
              </p>
            )}
            {canSubmit ? (
              <>
                <button type="submit" hidden />
                <a
                  className="login-button"
                  href="/consent-form"
                  onClick={(event) => {
                    event.preventDefault();
                    event.currentTarget.closest("form")?.requestSubmit();
                  }}
                >
                  Masuk
                </a>
              </>
            ) : (
              <button type="submit" className="login-button" disabled>
                {pending ? "Menyimpan…" : "Masuk"}
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

