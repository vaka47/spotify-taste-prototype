"use client";

import Link from "next/link";
import { useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";
import { travis } from "@/lib/mock-data";

const steps = ["account", "team", "settings", "review"] as const;

export default function ArtistOnboardingPage() {
  const { locale } = useI18n();
  const { showToast } = useToast();
  const ru = locale === "ru";
  const [step, setStep] = useState(0);
  const [meaningfulOnly, setMeaningfulOnly] = useState(true);
  const [delay, setDelay] = useState(true);
  const [noteNotifications, setNoteNotifications] = useState(true);
  const [complete, setComplete] = useState(false);

  const stepLabels = ru
    ? ["Аккаунт", "Команда", "Настройки", "Предпросмотр"]
    : ["Account", "Team", "Controls", "Preview"];

  function next() {
    setStep(current => Math.min(steps.length - 1, current + 1));
  }

  function activate() {
    setComplete(true);
    showToast(ru ? "Предпросмотр Taste включён" : "Taste preview activated");
  }

  return (
    <main className="page artistOnboardingPage">
      <header className="nativePageHeader onboardingHeader">
        <span className="eyebrow">{ru ? "ПОДКЛЮЧЕНИЕ ДЛЯ АРТИСТА" : "ARTIST ACTIVATION"}</span>
        <h1>{ru ? "Включите Taste для подтверждённого профиля." : "Activate Taste for a verified artist profile."}</h1>
        <p>{ru ? "Без отдельной переписки: Spotify уже знает, кто управляет профилем. Права команды Spotify for Artists становятся основой доступа к публикации Taste." : "No separate email thread: Spotify already knows who manages the profile. Existing Spotify for Artists team rights become the permission layer for Taste publishing."}</p>
      </header>

      <ol className="onboardingSteps" aria-label={ru ? "Этапы подключения" : "Activation steps"}>
        {stepLabels.map((label, index) => (
          <li className={index === step ? "active" : index < step ? "done" : ""} key={label}>
            <span>{index < step ? <Icon name="check" size={14} /> : index + 1}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>

      <section className="onboardingWorkspace">
        {step === 0 ? (
          <div className="onboardingStage">
            <div className="onboardingStageIcon"><Icon name="user" size={28} /></div>
            <div>
              <h2>{ru ? "Войдите в рабочий аккаунт" : "Sign in with your work account"}</h2>
              <p>{ru ? "Используйте тот же Spotify-аккаунт, через который вы открываете Spotify for Artists. Пароль и права команды остаются у Spotify." : "Use the same Spotify account you use for Spotify for Artists. Passwords and team permissions remain with Spotify."}</p>
            </div>
            <button className="nativePrimaryButton onboardingPrimary" type="button" onClick={next}>{ru ? "Продолжить через Spotify for Artists" : "Continue with Spotify for Artists"}<Icon name="chevronRight" size={17} /></button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="onboardingStage">
            <div className="onboardingStageIcon"><Icon name="check" size={28} /></div>
            <div>
              <h2>{ru ? "Выберите команду артиста" : "Choose an artist team"}</h2>
              <p>{ru ? "Taste можно включить только для профиля, где у вас есть право редактирования. Администратор команды контролирует доступ и видит журнал действий." : "Taste can only be activated for a profile where you have edit permission. The Team Admin controls access and can review the audit log."}</p>
            </div>
            <div className="onboardingArtistRow">
              <AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} />
              <span><strong>{travis.name}</strong><small>{ru ? "Spotify for Artists · Editor" : "Spotify for Artists · Editor"}</small></span>
              <span className="onboardingVerified"><Icon name="check" size={15} />{ru ? "Права подтверждены" : "Access verified"}</span>
            </div>
            <div className="onboardingStageActions"><button className="nativeOutlineButton" type="button" onClick={() => setStep(0)}>{ru ? "Назад" : "Back"}</button><button className="nativePrimaryButton" type="button" onClick={next}>{ru ? "Выбрать профиль" : "Select profile"}<Icon name="chevronRight" size={17} /></button></div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="onboardingStage">
            <div className="onboardingStageIcon"><Icon name="privacy" size={28} /></div>
            <div>
              <h2>{ru ? "Настройте правила публикации" : "Set publishing controls"}</h2>
              <p>{ru ? "Настройки можно изменить в любой момент. Разовые прослушивания по умолчанию не становятся публичной рекомендацией." : "Controls can be changed at any time. A one-off play never becomes a public endorsement by default."}</p>
            </div>
            <div className="onboardingControlList">
              <label><span><strong>{ru ? "Только значимые сигналы" : "Meaningful signals only"}</strong><small>{ru ? "Повторы, сохранения и явные рекомендации" : "Repeats, saves and explicit recommendations"}</small></span><input type="checkbox" checked={meaningfulOnly} onChange={event => setMeaningfulOnly(event.target.checked)} /><i aria-hidden="true" /></label>
              <label><span><strong>{ru ? "Публиковать через 24 часа" : "Publish after 24 hours"}</strong><small>{ru ? "История не превращается в трансляцию в реальном времени" : "Prevents listening history from becoming real-time surveillance"}</small></span><input type="checkbox" checked={delay} onChange={event => setDelay(event.target.checked)} /><i aria-hidden="true" /></label>
              <label><span><strong>{ru ? "Уведомлять о комментариях автора" : "Notify followers about artist notes"}</strong><small>{ru ? "Подписчик увидит комментарий в очереди и сам решит, оставить ли звуковой сигнал" : "Followers see the note in queue and control their own sound cue"}</small></span><input type="checkbox" checked={noteNotifications} onChange={event => setNoteNotifications(event.target.checked)} /><i aria-hidden="true" /></label>
            </div>
            <div className="onboardingStageActions"><button className="nativeOutlineButton" type="button" onClick={() => setStep(1)}>{ru ? "Назад" : "Back"}</button><button className="nativePrimaryButton" type="button" onClick={next}>{ru ? "Открыть предпросмотр" : "Open preview"}<Icon name="chevronRight" size={17} /></button></div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="onboardingStage onboardingReviewStage">
            <div className="onboardingStageIcon"><Icon name={complete ? "check" : "taste"} size={28} /></div>
            <div>
              <h2>{complete ? (ru ? "Taste готов к закрытому предпросмотру" : "Taste is ready for private preview") : (ru ? "Проверьте, что увидят подписчики" : "Review what followers will see")}</h2>
              <p>{complete ? (ru ? "Публичная лента пока не включена. Команда может семь дней проверить сигналы, скрыть исключения и только потом открыть Taste подписчикам." : "The public feed is still off. The team gets seven days to review signals, hide exceptions and then launch Taste to followers.") : (ru ? "Перед публичным запуском команда получает семидневный предпросмотр и журнал всех опубликованных сигналов." : "Before launch, the team gets a seven-day preview and an audit log of every publishable signal.")}</p>
            </div>
            <div className="onboardingReview">
              <div><span>{ru ? "Профиль" : "Profile"}</span><strong>{travis.name}</strong></div>
              <div><span>{ru ? "Сигналы" : "Signals"}</span><strong>{meaningfulOnly ? (ru ? "Только значимые" : "Meaningful only") : (ru ? "Выбранные вручную" : "Manual selection")}</strong></div>
              <div><span>{ru ? "Задержка" : "Delay"}</span><strong>{delay ? (ru ? "24 часа" : "24 hours") : (ru ? "Без задержки" : "No delay")}</strong></div>
              <div><span>{ru ? "Комментарии" : "Notes"}</span><strong>{noteNotifications ? (ru ? "С уведомлениями" : "Notify followers") : (ru ? "Без уведомлений" : "No notifications")}</strong></div>
            </div>
            {complete ? <div className="onboardingCompleteActions"><Link className="nativePrimaryButton" href="/tastemaker/travis-scott">{ru ? "Открыть предпросмотр Taste" : "Open Taste preview"}<Icon name="external" size={17} /></Link></div> : <div className="onboardingStageActions"><button className="nativeOutlineButton" type="button" onClick={() => setStep(2)}>{ru ? "Назад" : "Back"}</button><button className="nativePrimaryButton" type="button" onClick={activate}>{ru ? "Начать предпросмотр" : "Start private preview"}<Icon name="check" size={17} /></button></div>}
          </div>
        ) : null}
      </section>

      <section className="onboardingFallback">
        <div><Icon name="info" size={20} /><span><strong>{ru ? "Когда всё-таки нужна ручная проверка" : "When manual review is still needed"}</strong><p>{ru ? "Если профиль ещё не подтверждён, у команды нет администратора или права переходят лейблу либо наследникам, Spotify проверяет запрос вручную. Для обычной активации Taste отдельное письмо не нужно." : "Spotify reviews requests manually when a profile is unclaimed, the team has no reachable admin, or rights are moving to a label or estate. Standard Taste activation needs no separate email."}</p></span></div>
        <a href="https://support.spotify.com/artists/article/getting-access-to-spotify-for-artists/" target="_blank" rel="noreferrer">{ru ? "Как Spotify подтверждает доступ" : "How Spotify verifies access"}<Icon name="external" size={16} /></a>
      </section>
    </main>
  );
}
