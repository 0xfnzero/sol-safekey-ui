"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from '@/hooks/useTranslations';
import {
  Key,
  Lock,
  FileText,
  Download,
  Upload,
  Wallet,
  Send,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Coins,
  ArrowRightLeft,
  Unlock,
  X,
} from "lucide-react";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { DEFAULT_API_PORT } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  network?: boolean;
}

interface FormState {
  [key: string]: string | number | undefined;
}

interface ApiRequestBody {
  [key: string]: string | number | undefined;
}

/** 与 UI 一致：① keystore.json ② 加密私钥字符串 ③ 明文私钥 */
type WalletAuthTab = "keystore" | "encrypted" | "private";

function encryptedKeyFromForm(formData: FormState): string {
  return String(
    (formData as Record<string, unknown>).encrypted_key ??
      (formData as Record<string, unknown>).encryptedKey ??
      ""
  ).trim();
}

function validateWalletAuth(
  method: WalletAuthTab,
  formData: FormState,
  privateField: "private_key" | "secret_key",
): boolean {
  if (method === "keystore") {
    return !!(String(formData.keystoreJson ?? "").trim() && formData.password);
  }
  if (method === "encrypted") {
    return !!(encryptedKeyFromForm(formData) && formData.password);
  }
  const raw =
    privateField === "secret_key" ? formData.secretKey : formData.private_key;
  return !!String(raw ?? "").trim();
}

function applyWalletAuth(
  body: ApiRequestBody,
  method: WalletAuthTab,
  formData: FormState,
  privateField: "private_key" | "secret_key",
) {
  if (method === "keystore") {
    body.keystore_json = String(formData.keystoreJson ?? "").trim();
    body.password = formData.password;
  } else if (method === "encrypted") {
    body.encrypted_key = encryptedKeyFromForm(formData);
    body.password = formData.password;
  } else {
    const raw =
      privateField === "secret_key" ? formData.secretKey : formData.private_key;
    const v = String(raw ?? "").trim();
    if (privateField === "secret_key") body.secret_key = v;
    else body.private_key = v;
  }
}

/** 滑点百分比（如 1 表示 1%）→ 后端 basis points（×100），空则默认 1% */
function slippagePercentToBasisPoints(v: string | number | undefined): number {
  if (v === undefined || v === "") return 100;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return 100;
  return Math.floor(n * 100);
}

function slippageInputDisplay(v: string | number | undefined): number {
  if (v === undefined || v === "") return 1;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? 1 : n;
}

export default function Home() {
  const t = useTranslations();

  const menuItems: MenuItem[] = [
    {
      id: "create",
      label: t("menu.core"),
      icon: <Key className="w-5 h-5" />,
      children: [
        { id: "create-plain", label: t("features.create-plain.title"), icon: <Key className="w-4 h-4" /> },
        { id: "create-encrypted", label: t("features.create-encrypted.title"), icon: <Lock className="w-4 h-4" /> },
        { id: "create-keystore", label: t("features.create-keystore.title"), icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      id: "import",
      label: t("menu.import"),
      icon: <Upload className="w-5 h-5" />,
      children: [
        { id: "import-keystore", label: t("features.import-keystore.title"), icon: <FileText className="w-4 h-4" /> },
        { id: "decrypt", label: t("features.decrypt.title"), icon: <Lock className="w-4 h-4" /> },
      ],
    },
    {
      id: "security",
      label: t("menu.security"),
      icon: <Lock className="w-5 h-5" />,
      children: [
        { id: "setup-2fa", label: t("features.setup-2fa.title"), icon: <Lock className="w-4 h-4" /> },
        { id: "create-tfa", label: t("features.create-tfa.title"), icon: <Lock className="w-4 h-4" /> },
        { id: "unlock-tfa", label: t("features.unlock-tfa.title"), icon: <Unlock className="w-4 h-4" /> },
      ],
    },
    {
      id: "wallet",
      label: t("menu.wallet"),
      icon: <Wallet className="w-5 h-5" />,
      children: [
        { id: "unlock", label: t("features.unlock.title"), icon: <Unlock className="w-4 h-4" /> },
        { id: "check-balance", label: t("features.check-balance.title"), icon: <Wallet className="w-4 h-4" />, network: true },
        { id: "get-pubkey", label: t("features.get-pubkey.title"), icon: <Key className="w-4 h-4" /> },
      ],
    },
    {
      id: "transfer",
      label: t("menu.transfer"),
      icon: <Send className="w-5 h-5" />,
      children: [
        { id: "transfer-sol", label: t("features.transfer-sol.title"), icon: <Send className="w-4 h-4" />, network: true },
        { id: "transfer-token", label: t("features.transfer-token.title"), icon: <Coins className="w-4 h-4" />, network: true },
      ],
    },
    {
      id: "wsol",
      label: t("menu.wsol"),
      icon: <RefreshCw className="w-5 h-5" />,
      children: [
        { id: "create-wsol-ata", label: t("features.create-wsol-ata.title"), icon: <Hash className="w-4 h-4" />, network: true },
        { id: "wrap-sol", label: t("features.wrap-sol.title"), icon: <RefreshCw className="w-4 h-4" />, network: true },
        { id: "unwrap-sol", label: t("features.unwrap-sol.title"), icon: <ArrowRightLeft className="w-4 h-4" />, network: true },
        { id: "close-wsol-ata", label: t("features.close-wsol-ata.title"), icon: <X className="w-4 h-4" />, network: true },
      ],
    },
    {
      id: "pump",
      label: t("menu.pump"),
      icon: <Coins className="w-5 h-5" />,
      children: [
        { id: "pumpfun-sell", label: t("features.pumpfun-sell.title"), icon: <Coins className="w-4 h-4" />, network: true },
        { id: "pumpswap-sell", label: t("features.pumpswap-sell.title"), icon: <Coins className="w-4 h-4" />, network: true },
        { id: "pumpfun-cashback", label: t("features.pumpfun-cashback.title"), icon: <Coins className="w-4 h-4" />, network: true },
        { id: "pumpswap-cashback", label: t("features.pumpswap-cashback.title"), icon: <Coins className="w-4 h-4" />, network: true },
      ],
    },
    {
      id: "advanced",
      label: t("menu.advanced"),
      icon: <Hash className="w-5 h-5" />,
      children: [
        { id: "create-nonce", label: t("features.create-nonce.title"), icon: <Hash className="w-4 h-4" />, network: true },
      ],
    },
  ];

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<{ [key: string]: "keystore" | "private" | "encrypted" }>({});

  const walletAuth = (formId: string): WalletAuthTab =>
    (authMethod[formId] ?? "keystore") as WalletAuthTab;

  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleFormChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => {
      if (value === undefined) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  const clearForm = () => {
    setFormData({});
  };

  const handleSelectForm = (formId: string) => {
    clearForm();
    setSelectedForm(formId);
    // Set default auth method to keystore for all forms that support three-way auth
    const formsWithAuthMethod = [
      "decrypt", "unlock", "get-pubkey", "transfer-sol", "transfer-token",
      "create-wsol-ata", "wrap-sol", "unwrap-sol", "close-wsol-ata",
      "create-nonce", "pumpfun-sell", "pumpswap-sell", "create-tfa",
      "pumpfun-cashback", "pumpswap-cashback",
    ];
    if (formsWithAuthMethod.includes(formId)) {
      setAuthMethod({ ...authMethod, [formId]: "keystore" });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success(t("common.copiedToClipboard"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("errors.copyFailed"));
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("common.downloaded", { filename }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleFormChange("keystoreJson", content);
        toast.success(t("features.import-keystore.fileUploaded"));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (formId: string) => {
    setLoading(true);

    try {
      switch (formId) {
        case "create-plain": {
          const response = await apiFetch("keys/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formData.name || "default" }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.create-plain.success"));
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || t("errors.createFailed"));
          }
          break;
        }

        case "create-encrypted": {
          const password = String(formData.password || "");
          if (password.length < 10 || password.length > 20) {
            toast.error(t("errors.passwordLength"));
            setLoading(false);
            return;
          }

          const createResponse = await apiFetch("keys/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({ error: t("errors.unknownError") }));
            toast.error(errorData.error || t("errors.createFailed"));
            break;
          }

          const createData = await createResponse.json();
          if (!createData.secret_key) {
            toast.error(t("features.create-encrypted.createKeyFailed"));
            break;
          }

          const encryptResponse = await apiFetch("keys/encrypt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret_key: createData.secret_key,
              password: password,
            }),
          });

          if (encryptResponse.ok) {
            const encryptData = await encryptResponse.json();
            toast.success(t("features.create-encrypted.success"));
            setFormData((prev) => ({
              ...prev,
              publicKey: createData.public_key,
              encryptedKey: encryptData.encrypted_key,
            }));
          } else {
            const errorData = await encryptResponse.json().catch(() => ({ error: t("errors.unknownError") }));
            toast.error(errorData.error || t("features.create-encrypted.encryptFailed"));
          }
          break;
        }

        case "create-keystore": {
          if (!formData.password || String(formData.password).length < 10) {
            toast.error(t("features.create-keystore.passwordError"));
            setLoading(false);
            return;
          }

          const response = await apiFetch("keys/create-keystore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: formData.password }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.create-keystore.success"));
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              keystoreJson: data.keystore_json,
            }));
          } else {
            toast.error(data.error || t("errors.createFailed"));
          }
          break;
        }

        case "import-keystore": {
          if (!formData.keystoreJson || !formData.password) {
            toast.error(t("features.import-keystore.fillAllFields"));
            setLoading(false);
            return;
          }

          const response = await apiFetch("keys/import-keystore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keystore_json: formData.keystoreJson,
              password: formData.password,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.import-keystore.success"));
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || t("features.import-keystore.error"));
          }
          break;
        }

        case "decrypt": {
          const dm = walletAuth("decrypt");
          if (dm === "keystore") {
            if (!validateWalletAuth(dm, formData, "private_key")) {
              toast.error(t("features.unlock.fillAllFields"));
              setLoading(false);
              return;
            }
            const response = await apiFetch("wallet/unlock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                keystore_json: String(formData.keystoreJson ?? "").trim(),
                password: formData.password,
              }),
            });
            const data = await response.json();
            if (response.ok) {
              toast.success(t("features.decrypt.success"));
              setFormData((prev) => ({ ...prev, secretKey: data.secret_key }));
            } else {
              toast.error(data.error || t("features.decrypt.error"));
            }
          } else if (dm === "encrypted") {
            if (!validateWalletAuth(dm, formData, "private_key")) {
              toast.error(t("features.decrypt.fillAllFields"));
              setLoading(false);
              return;
            }
            const response = await apiFetch("keys/decrypt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                encrypted_key: encryptedKeyFromForm(formData),
                password: formData.password,
              }),
            });
            const data = await response.json();
            if (response.ok) {
              toast.success(t("features.decrypt.success"));
              setFormData((prev) => ({ ...prev, secretKey: data.secret_key }));
            } else {
              toast.error(data.error || t("features.decrypt.error"));
            }
          } else {
            if (!String(formData.secretKey ?? "").trim()) {
              toast.error(t("features.get-pubkey.enterPrivateKey"));
              setLoading(false);
              return;
            }
            toast.success(t("features.decrypt.success"));
          }
          break;
        }

        case "unlock": {
          const um = walletAuth("unlock");
          if (!validateWalletAuth(um, formData, "secret_key")) {
            toast.error(t("features.unlock.fillAllFields"));
            setLoading(false);
            return;
          }
          if (um === "keystore") {
            const response = await apiFetch("wallet/unlock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                keystore_json: String(formData.keystoreJson ?? "").trim(),
                password: formData.password,
              }),
            });
            const data = await response.json();
            if (response.ok) {
              toast.success(t("features.unlock.success"));
              setFormData((prev) => ({
                ...prev,
                publicKey: data.public_key,
                secretKey: data.secret_key,
              }));
            } else {
              toast.error(data.error || t("features.unlock.error"));
            }
          } else if (um === "encrypted") {
            const decRes = await apiFetch("keys/decrypt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                encrypted_key: encryptedKeyFromForm(formData),
                password: formData.password,
              }),
            });
            const decData = await decRes.json();
            if (!decRes.ok) {
              toast.error(decData.error || t("features.unlock.error"));
              setLoading(false);
              return;
            }
            const secret = decData.secret_key as string;
            const pkRes = await apiFetch("wallet/get-pubkey", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ secret_key: secret }),
            });
            const pkData = await pkRes.json();
            if (pkRes.ok) {
              toast.success(t("features.unlock.success"));
              setFormData((prev) => ({
                ...prev,
                publicKey: pkData.public_key,
                secretKey: secret,
              }));
            } else {
              toast.error(pkData.error || t("features.unlock.error"));
            }
          } else {
            const pkRes = await apiFetch("wallet/get-pubkey", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                secret_key: String(formData.secretKey ?? "").trim(),
              }),
            });
            const pkData = await pkRes.json();
            if (pkRes.ok) {
              toast.success(t("features.unlock.success"));
              setFormData((prev) => ({
                ...prev,
                publicKey: pkData.public_key,
                secretKey: formData.secretKey,
              }));
            } else {
              toast.error(pkData.error || t("features.unlock.error"));
            }
          }
          break;
        }

        case "check-balance": {
          if (!formData.address) {
            toast.error(t("features.check-balance.enterAddress"));
            setLoading(false);
            return;
          }

          const response = await apiFetch("wallet/balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: formData.address,
              network: formData.network || "mainnet",
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(
              t("features.check-balance.success", {
                balance: data.balance,
                network: data.network,
              }),
            );
            setFormData((prev) => ({
              ...prev,
              balance: data.balance.toString(),
              network: data.network,
            }));
          } else {
            toast.error(data.error || t("features.check-balance.error"));
          }
          break;
        }

        case "get-pubkey": {
          const method = walletAuth("get-pubkey");
          if (!validateWalletAuth(method, formData, "secret_key")) {
            toast.error(
              method === "keystore"
                ? t("features.get-pubkey.uploadKeystore")
                : method === "encrypted"
                  ? t("features.get-pubkey.enterEncrypted")
                  : t("features.get-pubkey.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {};
          applyWalletAuth(requestBody, method, formData, "secret_key");

          const response = await apiFetch("wallet/get-pubkey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.get-pubkey.success"));
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || t("features.get-pubkey.error"));
          }
          break;
        }

        case "transfer-sol": {
          const m = walletAuth("transfer-sol");
          if (!formData.to_address || formData.amount === undefined || formData.amount === "") {
            toast.error(t("features.transfer-sol.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.transfer-sol.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            to_address: formData.to_address,
            amount: parseFloat(formData.amount as string),
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("transfer/sol", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.transfer-sol.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.transfer-sol.error"));
          }
          break;
        }

        case "transfer-token": {
          const m = walletAuth("transfer-token");
          if (!formData.to_address || !formData.mint || formData.amount === undefined || formData.amount === "") {
            toast.error(t("features.transfer-token.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.transfer-token.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            to_address: formData.to_address,
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            decimals: parseInt(formData.decimals as string) || 9,
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("transfer/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.transfer-token.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.transfer-token.error"));
          }
          break;
        }

        case "create-wsol-ata": {
          const m = walletAuth("create-wsol-ata");
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(
              m === "keystore"
                ? t("features.create-wsol-ata.uploadKeystore")
                : m === "encrypted"
                  ? t("features.decrypt.fillAllFields")
                  : t("features.create-wsol-ata.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("wsol/create-ata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.create-wsol-ata.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.create-wsol-ata.error"));
          }
          break;
        }

        case "wrap-sol": {
          const m = walletAuth("wrap-sol");
          if (formData.amount === undefined || formData.amount === "") {
            toast.error(t("features.wrap-sol.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.wrap-sol.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            amount: parseFloat(formData.amount as string),
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("wsol/wrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.wrap-sol.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.wrap-sol.error"));
          }
          break;
        }

        case "unwrap-sol": {
          const m = walletAuth("unwrap-sol");
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(
              m === "keystore"
                ? t("features.unwrap-sol.uploadKeystore")
                : m === "encrypted"
                  ? t("features.decrypt.fillAllFields")
                  : t("features.unwrap-sol.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("wsol/unwrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.unwrap-sol.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.unwrap-sol.error"));
          }
          break;
        }

        case "create-nonce": {
          const m = walletAuth("create-nonce");
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(
              m === "keystore"
                ? t("features.create-nonce.uploadKeystore")
                : m === "encrypted"
                  ? t("features.decrypt.fillAllFields")
                  : t("features.create-nonce.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("nonce/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.create-nonce.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              nonceAccount: data.nonce_account,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.create-nonce.error"));
          }
          break;
        }

        case "setup-2fa": {
          if (!formData.hardware_fingerprint || !formData.master_password) {
            toast.error(t("features.setup-2fa.fillAllFields"));
            setLoading(false);
            return;
          }

          const response = await apiFetch("2fa/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hardware_fingerprint: formData.hardware_fingerprint,
              master_password: formData.master_password,
              account: formData.account || "sol-safekey",
              issuer: formData.issuer || "Sol SafeKey",
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.setup-2fa.success"));
            setFormData((prev) => ({
              ...prev,
              totp_secret: data.totp_secret,
              qr_code_url: data.qr_code_url,
            }));
          } else {
            toast.error(data.error || t("features.setup-2fa.error"));
          }
          break;
        }

        case "create-tfa": {
          const m = walletAuth("create-tfa");
          if (
            !formData.totp_secret ||
            !formData.hardware_fingerprint ||
            !formData.master_password ||
            formData.question_index === undefined ||
            !formData.security_answer
          ) {
            toast.error(t("features.create-tfa.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.create-tfa.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            totp_secret: formData.totp_secret,
            hardware_fingerprint: formData.hardware_fingerprint,
            master_password: formData.master_password,
            question_index: formData.question_index,
            security_answer: formData.security_answer,
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("2fa/create-tfa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.create-tfa.success"));
            setFormData((prev) => ({
              ...prev,
              encrypted_wallet: data.encrypted_wallet,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || t("features.create-tfa.error"));
          }
          break;
        }

        case "unlock-tfa": {
          if (!formData.encrypted_wallet || !formData.hardware_fingerprint || !formData.master_password ||
              !formData.security_answer || !formData.totp_code) {
            toast.error(t("features.unlock-tfa.fillAllFields"));
            setLoading(false);
            return;
          }

          const response = await apiFetch("2fa/unlock-tfa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              encrypted_wallet: formData.encrypted_wallet,
              hardware_fingerprint: formData.hardware_fingerprint,
              master_password: formData.master_password,
              security_answer: formData.security_answer,
              totp_code: formData.totp_code,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.unlock-tfa.success"));
            setFormData((prev) => ({
              ...prev,
              private_key: data.private_key,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || t("features.unlock-tfa.error"));
          }
          break;
        }

        case "close-wsol-ata": {
          const m = walletAuth("close-wsol-ata");
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(
              m === "keystore"
                ? t("features.close-wsol-ata.uploadKeystore")
                : m === "encrypted"
                  ? t("features.decrypt.fillAllFields")
                  : t("features.close-wsol-ata.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("wsol/close-ata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.close-wsol-ata.success", { signature: data.signature }));
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || t("features.close-wsol-ata.error"));
          }
          break;
        }

        case "pumpfun-sell": {
          const m = walletAuth("pumpfun-sell");
          if (!formData.mint || formData.amount === undefined || formData.amount === "") {
            toast.error(t("features.pumpfun-sell.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.pumpfun-sell.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            slippage: slippagePercentToBasisPoints(formData.slippage),
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("pumpfun/sell", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.pumpfun-sell.success"));
            setFormData((prev) => ({
              ...prev,
              status: data.status,
            }));
          } else {
            toast.error(data.error || t("features.pumpfun-sell.error"));
          }
          break;
        }

        case "pumpswap-sell": {
          const m = walletAuth("pumpswap-sell");
          if (!formData.mint || formData.amount === undefined || formData.amount === "") {
            toast.error(t("features.pumpswap-sell.fillAllFields"));
            setLoading(false);
            return;
          }
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(t("features.pumpswap-sell.fillAllFields"));
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            slippage: slippagePercentToBasisPoints(formData.slippage),
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const response = await apiFetch("pumpswap/sell", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(t("features.pumpswap-sell.success"));
            setFormData((prev) => ({
              ...prev,
              status: data.status,
            }));
          } else {
            toast.error(data.error || t("features.pumpswap-sell.error"));
          }
          break;
        }

        case "pumpfun-cashback":
        case "pumpswap-cashback": {
          const m = walletAuth(formId);
          if (!validateWalletAuth(m, formData, "private_key")) {
            toast.error(
              m === "keystore"
                ? t("features.pumpfun-cashback.uploadKeystore")
                : m === "encrypted"
                  ? t("features.decrypt.fillAllFields")
                  : t("features.pumpfun-cashback.enterPrivateKey"),
            );
            setLoading(false);
            return;
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };
          applyWalletAuth(requestBody, m, formData, "private_key");

          const apiUrlPath = formId === "pumpfun-cashback" ? "/pumpfun/cashback" : "/pumpswap/cashback";
          const response = await apiFetch(apiUrlPath.replace(/^\//, ""), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            if (data.status === "info") {
              toast.info(data.message);
            } else {
              toast.success(
                formId === "pumpfun-cashback"
                  ? t("features.pumpfun-cashback.success")
                  : t("features.pumpswap-cashback.success"),
              );
            }
            setFormData((prev) => ({
              ...prev,
              message: data.message,
              status: data.status,
            }));
          } else {
            toast.error(
              data.error ||
                (formId === "pumpfun-cashback"
                  ? t("features.pumpfun-cashback.error")
                  : t("features.pumpswap-cashback.error")),
            );
          }
          break;
        }

        default:
          toast.error(t("errors.unknownFeature"));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : t("errors.unknownError");
      toast.error(
        t("errors.requestFailedWithHint", {
          message,
          port: String(DEFAULT_API_PORT),
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (formId: string) => {
    switch (formId) {
      case "create-plain":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-plain.name")}</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-plain.namePlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("create-plain")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-plain.creating") : t("features.create-plain.createButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.secretKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.secretKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.secretKey as string, "privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "create-encrypted":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-encrypted.password")}</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-encrypted.passwordPlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("create-encrypted")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-encrypted.creating") : t("features.create-encrypted.createButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "enc-pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "enc-pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-encrypted.encryptedKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.encryptedKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.encryptedKey as string, "enc-privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "enc-privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "create-keystore":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-keystore.password")}</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-keystore.passwordPlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("create-keystore")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-keystore.creating") : t("features.create-keystore.createButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "ks-pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "ks-pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-keystore.keystoreJson")}</label>
                  <div className="flex gap-2">
                    <textarea
                      readOnly
                      className="flex-1 px-3 py-2 bg-black/30 rounded text-xs h-24 resize-none"
                      value={formData.keystoreJson ?? ""}
                    />
                    <button
                      onClick={() => copyToClipboard(formData.keystoreJson as string, "ks-json")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "ks-json" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(formData.keystoreJson as string, "keystore.json")}
                  className="w-full py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("features.create-keystore.downloadFile")}
                </button>
              </div>
            )}
          </div>
        );

      case "import-keystore":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.import-keystore.selectFile")}</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
              />
            </div>
            <div className="text-center text-gray-400">{t("features.import-keystore.or")}</div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.import-keystore.pasteJson")}</label>
              <textarea
                value={formData.keystoreJson || ""}
                onChange={(e) => handleFormChange("keystoreJson", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                placeholder={t("features.import-keystore.jsonPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.import-keystore.password")}</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.import-keystore.passwordPlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("import-keystore")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.import-keystore.importing") : t("features.import-keystore.importButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.publicKey}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.decrypt.secretKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.secretKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.secretKey as string, "imp-privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "imp-privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "decrypt": {
        const decryptAuth = walletAuth("decrypt");
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    decryptAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    decryptAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    decryptAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {decryptAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {decryptAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {decryptAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintext")}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("decrypt")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.decrypt.decrypting") : t("features.decrypt.decryptButton")}
            </button>
            {formData.secretKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.decrypt.secretKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.secretKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.secretKey as string, "dec-privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "dec-privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "unlock": {
        const unlockAuth = walletAuth("unlock");
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    unlockAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    unlockAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    unlockAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {unlockAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {unlockAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {unlockAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintext")}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("unlock")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.unlock.unlocking") : t("features.unlock.unlockButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.publicKey}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.secretKeyUnlocked")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.secretKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.secretKey as string, "unlock-privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "unlock-privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "check-balance":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.address")}</label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => handleFormChange("address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.check-balance.addressPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("check-balance")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.check-balance.checking") : t("features.check-balance.checkButton")}
            </button>
            {formData.balance && (
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-center">
                  {formData.balance} SOL
                  {formData.network && ` (${formData.network})`}
                </p>
              </div>
            )}
          </div>
        );

      case "get-pubkey": {
        const getPubkeyAuth = walletAuth("get-pubkey");
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    getPubkeyAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    getPubkeyAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    getPubkeyAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {getPubkeyAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {getPubkeyAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[100px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {getPubkeyAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextSuggestEnc")}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("get-pubkey")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.get-pubkey.getting") : t("features.get-pubkey.getButton")}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "get-pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "get-pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "transfer-sol":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-sol": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-sol") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-sol": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-sol") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-sol": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-sol") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {/* Keystore Input */}
            {walletAuth("transfer-sol") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("transfer-sol") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("transfer-sol") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.senderPrivateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-sol.toAddress")}</label>
              <input
                type="text"
                value={formData.to_address || ""}
                onChange={(e) => handleFormChange("to_address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-sol.addressPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-sol.amount")}</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-sol.amountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("transfer-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.transfer-sol.transferring") : t("features.transfer-sol.transferButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "txsig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "txsig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "transfer-token":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-token": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-token") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-token": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-token") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "transfer-token": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("transfer-token") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("transfer-token") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("transfer-token") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("transfer-token") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.senderPrivateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-token.toAddress")}</label>
              <input
                type="text"
                value={formData.to_address || ""}
                onChange={(e) => handleFormChange("to_address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-token.addressPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-token.mintAddress")}</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-token.mintPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-token.amount")}</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-token.amountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.transfer-token.decimals")}</label>
              <input
                type="number"
                value={formData.decimals || "9"}
                onChange={(e) => handleFormChange("decimals", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.transfer-token.decimalsPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("transfer-token")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.transfer-token.transferring") : t("features.transfer-token.transferButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "token-txsig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "token-txsig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "create-wsol-ata":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-wsol-ata": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("create-wsol-ata") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-wsol-ata": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("create-wsol-ata") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-wsol-ata": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("create-wsol-ata") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("create-wsol-ata") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("create-wsol-ata") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("create-wsol-ata") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("create-wsol-ata")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-wsol-ata.creating") : t("features.create-wsol-ata.createButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "wsol-ata-sig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "wsol-ata-sig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "wrap-sol":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "wrap-sol": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("wrap-sol") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "wrap-sol": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("wrap-sol") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "wrap-sol": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("wrap-sol") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("wrap-sol") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("wrap-sol") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("wrap-sol") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.wrap-sol.amount")}</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.wrap-sol.amountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("wrap-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.wrap-sol.wrapping") : t("features.wrap-sol.wrapButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "wrap-sig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "wrap-sig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "unwrap-sol":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unwrap-sol": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("unwrap-sol") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unwrap-sol": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("unwrap-sol") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unwrap-sol": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("unwrap-sol") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("unwrap-sol") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("unwrap-sol") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("unwrap-sol") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("unwrap-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.unwrap-sol.unwrapping") : t("features.unwrap-sol.unwrapButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "unwrap-sig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "unwrap-sig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "create-nonce": {
        const nonceAuth = walletAuth("create-nonce");
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-nonce": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    nonceAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-nonce": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    nonceAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-nonce": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    nonceAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {nonceAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    key={`create-nonce-${nonceAuth}`}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {nonceAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {nonceAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("create-nonce")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-nonce.creating") : t("features.create-nonce.createButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-nonce.nonceAccount")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.nonceAccount}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.nonceAccount as string, "nonce-addr")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "nonce-addr" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "nonce-sig")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "nonce-sig" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "setup-2fa":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.hardwareFingerprint")}</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.setup-2fa.fingerprintPlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-400">{t("features.setup-2fa.fingerprintHint")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.masterPassword")}</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.setup-2fa.masterPasswordPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.accountName")}</label>
              <input
                type="text"
                value={formData.account || ""}
                onChange={(e) => handleFormChange("account", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.setup-2fa.accountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.issuer")}</label>
              <input
                type="text"
                value={formData.issuer || ""}
                onChange={(e) => handleFormChange("issuer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.setup-2fa.issuerPlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("setup-2fa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.setup-2fa.generating") : t("features.setup-2fa.generateButton")}
            </button>
            {formData.totp_secret && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.totpSecret")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.totp_secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.totp_secret as string, "totp")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "totp" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.setup-2fa.qrCodeUrl")}</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.qr_code_url}
                  </code>
                </div>
              </div>
            )}
          </div>
        );

      case "create-tfa": {
        const tfaAuth = authMethod["create-tfa"] ?? "keystore";
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-tfa": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    tfaAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-tfa": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    tfaAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "create-tfa": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    tfaAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {tfaAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-tfa.uploadFile")}</label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-tfa.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("features.create-tfa.passwordPlaceholder")}
                  />
                </div>
              </>
            )}

            {tfaAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {tfaAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("features.create-tfa.privateKeyLabel")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("features.create-tfa.privateKeyPlaceholder")}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-tfa.totpSecret")}</label>
              <input
                type="text"
                value={formData.totp_secret || ""}
                onChange={(e) => handleFormChange("totp_secret", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-tfa.totpSecretPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-tfa.hardwareFingerprint")}</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-tfa.fingerprintPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-tfa.masterPassword")}</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-tfa.masterPasswordPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-tfa.questionIndex")}</label>
              <input
                type="number"
                value={formData.question_index === undefined ? "" : formData.question_index}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    handleFormChange("question_index", undefined);
                    return;
                  }
                  const n = parseInt(raw, 10);
                  handleFormChange("question_index", Number.isNaN(n) ? undefined : n);
                }}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-tfa.questionIndexPlaceholder")}
                min="0"
                max="9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.create-tfa.securityAnswer")}</label>
              <input
                type="text"
                value={formData.security_answer || ""}
                onChange={(e) => handleFormChange("security_answer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.create-tfa.answerPlaceholder")}
              />
            </div>
            <button
              onClick={() => handleSubmit("create-tfa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.create-tfa.creating") : t("features.create-tfa.createButton")}
            </button>
            {formData.encrypted_wallet && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "tfa-pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "tfa-pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-tfa.encryptedWallet")}</label>
                  <p className="text-xs text-gray-400">{t("features.create-tfa.saveHint")}</p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all max-h-32 overflow-y-auto">
                      {formData.encrypted_wallet}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.encrypted_wallet as string, "tfa-enc")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "tfa-enc" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "unlock-tfa":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.encryptedWallet")}</label>
              <textarea
                value={formData.encrypted_wallet || ""}
                onChange={(e) => handleFormChange("encrypted_wallet", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[100px]"
                placeholder={t("features.unlock-tfa.walletPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.hardwareFingerprint")}</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.unlock-tfa.fingerprintPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.masterPassword")}</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.unlock-tfa.masterPasswordPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.securityAnswer")}</label>
              <input
                type="text"
                value={formData.security_answer || ""}
                onChange={(e) => handleFormChange("security_answer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.unlock-tfa.answerPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.totpCode")}</label>
              <input
                type="text"
                value={formData.totp_code || ""}
                onChange={(e) => handleFormChange("totp_code", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.unlock-tfa.totpPlaceholder")}
                maxLength={6}
              />
            </div>
            <button
              onClick={() => handleSubmit("unlock-tfa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.unlock-tfa.unlocking") : t("features.unlock-tfa.unlockButton")}
            </button>
            {formData.private_key && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.create-plain.publicKey")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.publicKey as string, "unlock-pubkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "unlock-pubkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("features.unlock-tfa.privateKey")}</label>
                  <p className="text-xs text-red-400 mb-2">{t("formUi.privateKeyDanger")}</p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.private_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.private_key as string, "unlock-privkey")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "unlock-privkey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "close-wsol-ata":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "close-wsol-ata": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("close-wsol-ata") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "close-wsol-ata": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("close-wsol-ata") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "close-wsol-ata": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("close-wsol-ata") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("close-wsol-ata") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("close-wsol-ata") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("close-wsol-ata") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("close-wsol-ata")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.close-wsol-ata.closing") : t("features.close-wsol-ata.closeButton")}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.txSignature")}</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded text-xs break-all">
                      {formData.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formData.signature as string, "close-ata")}
                      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      {copied === "close-ata" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "pumpfun-sell":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpfun-sell": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpfun-sell") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpfun-sell": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpfun-sell") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpfun-sell": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpfun-sell") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("pumpfun-sell") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("pumpfun-sell") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("pumpfun-sell") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("features.pumpfun-sell.privateKeyLabel")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("features.pumpfun-sell.privateKeyPlaceholder")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpfun-sell.mintAddress")}</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpfun-sell.mintPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpfun-sell.amount")}</label>
              <input
                type="number"
                step="0.000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpfun-sell.amountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpfun-sell.slippage")}</label>
              <input
                type="number"
                step="0.1"
                value={slippageInputDisplay(formData.slippage)}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    handleFormChange("slippage", undefined);
                    return;
                  }
                  const n = parseFloat(raw);
                  handleFormChange("slippage", Number.isNaN(n) ? undefined : n);
                }}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpfun-sell.slippagePlaceholder")}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("pumpfun-sell")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.pumpfun-sell.selling") : t("features.pumpfun-sell.sellButton")}
            </button>
            {formData.status === "success" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400">{t("formUi.sellSuccess")}</p>
              </div>
            )}
          </div>
        );

      case "pumpswap-sell":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpswap-sell": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpswap-sell") === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpswap-sell": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpswap-sell") === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "pumpswap-sell": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    walletAuth("pumpswap-sell") === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {walletAuth("pumpswap-sell") === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("pumpswap-sell") === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {walletAuth("pumpswap-sell") === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("features.pumpswap-sell.privateKeyLabel")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("features.pumpswap-sell.privateKeyPlaceholder")}
                />
                <p className="mt-1 text-xs text-yellow-400">{t("formUi.warnPlaintextStrong")}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpswap-sell.mintAddress")}</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpswap-sell.mintPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpswap-sell.amount")}</label>
              <input
                type="number"
                step="0.000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpswap-sell.amountPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.pumpswap-sell.slippage")}</label>
              <input
                type="number"
                step="0.1"
                value={slippageInputDisplay(formData.slippage)}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    handleFormChange("slippage", undefined);
                    return;
                  }
                  const n = parseFloat(raw);
                  handleFormChange("slippage", Number.isNaN(n) ? undefined : n);
                }}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder={t("features.pumpswap-sell.slippagePlaceholder")}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("pumpswap-sell")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? t("features.pumpswap-sell.selling") : t("features.pumpswap-sell.sellButton")}
            </button>
            {formData.status === "success" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400">{t("formUi.sellSuccess")}</p>
              </div>
            )}
          </div>
        );

      case "pumpfun-cashback":
      case "pumpswap-cashback": {
        const cashbackAuth = walletAuth(selectedForm || "pumpfun-cashback");
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("formUi.authMethod")}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || "pumpfun-cashback"]: "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.encrypted_key;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    cashbackAuth === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabKeystore")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || "pumpfun-cashback"]: "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    cashbackAuth === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabEncrypted")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || "pumpfun-cashback"]: "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encrypted_key;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    cashbackAuth === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {t("formUi.tabPrivateKey")}
                </button>
              </div>
            </div>

            {cashbackAuth === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.uploadKeystore")}</label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">{t("formUi.fileUploadedOk")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderKeystorePassword")}
                  />
                </div>
              </>
            )}

            {cashbackAuth === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.encryptedKey")}</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder={t("formUi.placeholderEncryptedKey")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("formUi.password")}</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder={t("formUi.placeholderDecryptPassword")}
                  />
                </div>
              </>
            )}

            {cashbackAuth === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("formUi.privateKey")}</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder={t("formUi.placeholderPrivateKeyBase58")}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t("features.check-balance.network")}</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">{t("features.check-balance.mainnet")}</option>
                <option value="devnet">{t("features.check-balance.devnet")}</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit(selectedForm || "")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading
                ? selectedForm === "pumpswap-cashback"
                  ? t("features.pumpswap-cashback.claiming")
                  : t("features.pumpfun-cashback.claiming")
                : selectedForm === "pumpswap-cashback"
                  ? t("features.pumpswap-cashback.claimButton")
                  : t("features.pumpfun-cashback.claimButton")}
            </button>
            {formData.message && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">{formData.message}</p>
              </div>
            )}
          </div>
        );
      }

      default:
        return <div className="text-center text-gray-400">{t("formUi.pickFeature")}</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("app.title")}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{t("app.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => toggleMenu(item.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.children && (
                  activeMenu === item.id ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                )}
              </button>

              {item.children && activeMenu === item.id && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleSelectForm(child.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        selectedForm === child.id
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white"
                          : "hover:bg-white/5 text-gray-400"
                      }`}
                    >
                      {child.icon}
                      <span className="text-sm">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-black via-purple-950 to-black">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <h2 className="text-3xl font-bold mb-8">
                {selectedForm
                  ? menuItems
                      .flatMap((m) => m.children || [])
                      .find((c) => c?.id === selectedForm)?.label
                  : t("app.welcome")}
              </h2>
              {selectedForm ? renderForm(selectedForm) : (
                <div className="text-center py-12 text-gray-400">
                  <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{t("app.selectFeature")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
