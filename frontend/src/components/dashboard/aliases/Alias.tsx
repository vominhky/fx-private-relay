import { useRef, useState, ReactNode } from "react";
import { useLocalization } from "@fluent/react";
import { useToggleState, useTooltipTriggerState } from "react-stately";
import {
  mergeProps,
  useToggleButton,
  useTooltip,
  useTooltipTrigger,
} from "react-aria";
import styles from "./Alias.module.scss";
import copyIcon from "../../../../../static/images/copy-to-clipboard.svg";
import arrowDownIcon from "../../../../../static/images/arrowhead.svg";
import IllustrationHoliday from "../../../../public/illustrations/holiday.svg";
import IllustrationLibrary from "../../../../public/illustrations/library.svg";
import { AliasData, getFullAddress } from "../../../hooks/api/aliases";
import { ProfileData } from "../../../hooks/api/profile";
import { LabelEditor } from "./LabelEditor";
import { UserData } from "../../../hooks/api/user";
import { renderDate } from "../../../functions/renderDate";
import { AliasDeletionButton } from "./AliasDeletionButton";
import { getRuntimeConfig } from "../../../config";
import { getLocale } from "../../../functions/getLocale";
import { BlockLevel, BlockLevelSlider } from "./BlockLevelSlider";

export type Props = {
  alias: AliasData;
  profile: ProfileData;
  user: UserData;
  onUpdate: (updatedFields: Partial<AliasData>) => void;
  onDelete: () => void;
  defaultOpen?: boolean;
  showLabelEditor?: boolean;
};

/**
 * A card to manage (toggle it on/off, view details, ...) a single alias.
 */
export const Alias = (props: Props) => {
  const { l10n } = useLocalization();
  const [justCopied, setJustCopied] = useState(false);

  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const expandButtonState = useToggleState({
    defaultSelected: props.defaultOpen === true,
  });
  const expandButtonProps = useToggleButton(
    {},
    expandButtonState,
    expandButtonRef
  ).buttonProps;

  const address = getFullAddress(props.alias, props.profile);

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address);
    setJustCopied(true);
    setTimeout(() => {
      setJustCopied(false);
    }, 1 * 1000);
  };

  const labelEditor = props.showLabelEditor ? (
    <LabelEditor
      label={props.alias.description}
      onSubmit={(newLabel) => props.onUpdate({ description: newLabel })}
    />
  ) : null;

  let backgroundImage = undefined;
  if (
    [
      "Holiday",
      "Holidays",
      "Vakantie",
      "Urlaub",
      "Ferien",
      "Vacances",
    ].includes(props.alias.description)
  ) {
    backgroundImage = IllustrationHoliday.src;
  }
  if (
    [
      "Library",
      "Bibliotheek",
      "Bibliotek",
      "Bibliothek",
      "Biblioteek",
      "Bibliothèque",
    ].includes(props.alias.description)
  ) {
    backgroundImage = IllustrationLibrary.src;
  }

  const numberFormatter = new Intl.NumberFormat(getLocale(l10n), {
    notation: "compact",
    compactDisplay: "short",
  });

  let blockLevelLabel = null;
  if (props.alias.enabled === false) {
    blockLevelLabel = (
      <b className={`${styles.blockLevelLabel} ${styles.blockLevelAllLabel}`}>
        {l10n.getString("profile-promo-email-blocking-label-none")}
      </b>
    );
  } else if (props.alias.block_list_emails === true) {
    blockLevelLabel = (
      <b
        className={`${styles.blockLevelLabel} ${styles.blockLevelPromotionalLabel}`}
      >
        {l10n.getString("profile-promo-email-blocking-label-promotionals")}
      </b>
    );
  }

  const setBlockLevel = (blockLevel: BlockLevel) => {
    if (blockLevel === "none") {
      // The back-end rejects requests trying to set this property for free users:
      const blockPromotionals = props.profile.has_premium ? false : undefined;
      return props.onUpdate({
        enabled: true,
        block_list_emails: blockPromotionals,
      });
    }
    if (blockLevel === "promotional") {
      return props.onUpdate({ enabled: true, block_list_emails: true });
    }
    if (blockLevel === "all") {
      // The back-end rejects requests trying to set this property for free users:
      const blockPromotionals = props.profile.has_premium ? true : undefined;
      return props.onUpdate({
        enabled: false,
        block_list_emails: blockPromotionals,
      });
    }
  };

  return (
    <div
      className={`${styles.aliasCard} ${
        props.alias.enabled ? styles.isEnabled : styles.isDisabled
      } ${
        expandButtonState.isSelected ? styles.isExpanded : styles.isCollapsed
      }`}
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage}), none`
          : undefined,
      }}
    >
      <div className={styles.mainData}>
        <div className={styles.controls}>
          {labelEditor}
          <span className={styles.copyControls}>
            <span className={styles.copyButtonWrapper}>
              <button
                className={styles.copyButton}
                title={l10n.getString("profile-label-click-to-copy")}
                aria-label={l10n.getString("profile-label-click-to-copy-alt", {
                  address: address,
                })}
                onClick={copyAddressToClipboard}
              >
                <samp className={styles.address}>{address}</samp>
                <img src={copyIcon.src} alt="" className={styles.copyIcon} />
              </button>
              <span
                aria-hidden={!justCopied}
                className={`${styles.copiedConfirmation} ${
                  justCopied ? styles.isShown : ""
                }`}
              >
                {l10n.getString("profile-label-copied")}
              </span>
            </span>
          </span>
        </div>
        <div className={styles.blockLevelLabelWrapper}>{blockLevelLabel}</div>
        <div className={styles.aliasStats}>
          <BlockedTooltip>
            <span className={styles.number}>
              {numberFormatter.format(props.alias.num_blocked)}
            </span>
            <span className={styles.label}>
              {l10n.getString("profile-label-blocked")}
            </span>
          </BlockedTooltip>
          <ForwardedTooltip>
            <span className={styles.number}>
              {numberFormatter.format(props.alias.num_forwarded)}
            </span>
            <span className={styles.label}>
              {l10n.getString("profile-label-forwarded")}
            </span>
          </ForwardedTooltip>
        </div>
        <div className={styles.expandToggle}>
          <button {...expandButtonProps} ref={expandButtonRef}>
            <img
              src={arrowDownIcon.src}
              alt={l10n.getString(
                expandButtonState.isSelected
                  ? "profile-details-collapse"
                  : "profile-details-expand"
              )}
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>
      <div className={styles.secondaryData}>
        <div className={styles.row}>
          <BlockLevelSlider
            alias={props.alias}
            onChange={setBlockLevel}
            hasPremium={props.profile.has_premium}
          />
        </div>
        <div className={styles.row}>
          <dl>
            <div className={`${styles.forwardTarget} ${styles.metadata}`}>
              <dt>{l10n.getString("profile-label-forward-emails")}</dt>
              <dd>{props.user.email}</dd>
            </div>
            <div className={`${styles.dateCreated} ${styles.metadata}`}>
              <dt>{l10n.getString("profile-label-created")}</dt>
              <dd>{renderDate(props.alias.created_at, l10n)}</dd>
            </div>
          </dl>
          <AliasDeletionButton
            onDelete={props.onDelete}
            alias={props.alias}
            profile={props.profile}
          />
        </div>
      </div>
    </div>
  );
};

type TooltipProps = {
  children: ReactNode;
};
const ForwardedTooltip = (props: TooltipProps) => {
  const { l10n } = useLocalization();
  const triggerState = useTooltipTriggerState({ delay: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipTrigger = useTooltipTrigger({}, triggerState, triggerRef);

  const { tooltipProps } = useTooltip({}, triggerState);

  return (
    <span className={styles.statWrapper}>
      <span
        ref={triggerRef}
        {...tooltipTrigger.triggerProps}
        className={`${styles.stat} ${styles.forwardedStat}`}
      >
        {props.children}
      </span>
      {triggerState.isOpen && (
        <span
          {...mergeProps(tooltipTrigger.tooltipProps, tooltipProps)}
          className={styles.tooltip}
        >
          <span>{l10n.getString("profile-forwarded-copy")}</span>
          <br />
          <strong>{l10n.getString("profile-forwarded-note")}</strong>&nbsp;
          <span>
            {l10n.getString("profile-forwarded-note-copy", {
              size: getRuntimeConfig().emailSizeLimitNumber,
              unit: getRuntimeConfig().emailSizeLimitUnit,
            })}
          </span>
        </span>
      )}
    </span>
  );
};
const BlockedTooltip = (props: TooltipProps) => {
  const { l10n } = useLocalization();
  const triggerState = useTooltipTriggerState({ delay: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipTrigger = useTooltipTrigger({}, triggerState, triggerRef);

  const { tooltipProps } = useTooltip({}, triggerState);

  return (
    <span className={styles.statWrapper}>
      <span
        ref={triggerRef}
        {...tooltipTrigger.triggerProps}
        className={`${styles.stat} ${styles.blockedStat}`}
      >
        {props.children}
      </span>
      {triggerState.isOpen && (
        <span
          {...mergeProps(tooltipTrigger.tooltipProps, tooltipProps)}
          className={styles.tooltip}
        >
          {l10n.getString("profile-blocked-copy")}
        </span>
      )}
    </span>
  );
};
