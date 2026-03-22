"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
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

  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      "create-nonce", "pumpfun-sell", "pumpswap-sell", "create-tfa"
    ];
    if (formsWithAuthMethod.includes(formId)) {
      setAuthMethod({ ...authMethod, [formId]: "keystore" });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("复制失败");
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
    toast.success(`已下载 ${filename}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleFormChange("keystoreJson", content);
        toast.success("文件上传成功");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (formId: string) => {
    const apiUrl = "http://localhost:3001/api";
    setLoading(true);

    try {
      switch (formId) {
        case "create-plain": {
          const response = await fetch(`${apiUrl}/keys/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formData.name || "default" }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("创建成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || "创建失败");
          }
          break;
        }

        case "create-encrypted": {
          const password = String(formData.password || "");
          if (password.length < 10 || password.length > 20) {
            toast.error("密码长度必须在10-20字符之间");
            setLoading(false);
            return;
          }

          const createResponse = await fetch(`${apiUrl}/keys/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({ error: "未知错误" }));
            toast.error(errorData.error || "创建失败");
            break;
          }

          const createData = await createResponse.json();
          if (!createData.secret_key) {
            toast.error("创建密钥失败：未返回secret_key");
            break;
          }

          const encryptResponse = await fetch(`${apiUrl}/keys/encrypt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret_key: createData.secret_key,
              password: password,
            }),
          });

          if (encryptResponse.ok) {
            const encryptData = await encryptResponse.json();
            toast.success("加密成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: createData.public_key,
              encryptedKey: encryptData.encrypted_key,
            }));
          } else {
            const errorData = await encryptResponse.json().catch(() => ({ error: "未知错误" }));
            toast.error(errorData.error || "加密失败");
          }
          break;
        }

        case "create-keystore": {
          if (!formData.password || String(formData.password).length < 10) {
            toast.error("请输入10-20字符的密码");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/keys/create-keystore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: formData.password }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("Keystore文件创建成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              keystoreJson: data.keystore_json,
            }));
          } else {
            toast.error(data.error || "创建失败");
          }
          break;
        }

        case "import-keystore": {
          if (!formData.keystoreJson || !formData.password) {
            toast.error("请填写所有字段");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/keys/import-keystore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keystoreJson: formData.keystoreJson,
              password: formData.password,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("导入成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || "导入失败");
          }
          break;
        }

        case "decrypt": {
          if (!formData.encrypted_key || !formData.password) {
            toast.error("请填写所有字段");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/keys/decrypt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              encrypted_key: formData.encrypted_key,
              password: formData.password,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("解密成功！");
            setFormData((prev) => ({
              ...prev,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || "解密失败");
          }
          break;
        }

        case "unlock": {
          if (!formData.keystoreJson || !formData.password) {
            toast.error("请填写所有字段");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/wallet/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keystore_json: formData.keystoreJson,
              password: formData.password,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("钱包解锁成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
              secretKey: data.secret_key,
            }));
          } else {
            toast.error(data.error || "解锁失败");
          }
          break;
        }

        case "check-balance": {
          if (!formData.address) {
            toast.error("请输入钱包地址");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/wallet/balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: formData.address,
              network: formData.network || "mainnet",
            }),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`余额: ${data.balance} SOL (${data.network})`);
            setFormData((prev) => ({
              ...prev,
              balance: data.balance.toString(),
              network: data.network,
            }));
          } else {
            toast.error(data.error || "查询失败");
          }
          break;
        }

        case "get-pubkey": {
          const method = authMethod["get-pubkey"] || "private";

          if (method === "keystore") {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else if (method === "encrypted") {
            if (!formData.encryptedKey || !formData.password) {
              toast.error("请输入加密私钥和密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.secretKey) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {};

          if (method === "keystore") {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else if (method === "encrypted") {
            requestBody.encrypted_key = formData.encryptedKey;
            requestBody.password = formData.password;
          } else {
            requestBody.secret_key = formData.secretKey;
          }

          const response = await fetch(`${apiUrl}/wallet/get-pubkey`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("获取成功！");
            setFormData((prev) => ({
              ...prev,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || "获取失败");
          }
          break;
        }

        case "transfer-sol": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.to_address || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.to_address || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            to_address: formData.to_address,
            amount: parseFloat(formData.amount as string),
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/transfer/sol`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`转账成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "转账失败");
          }
          break;
        }

        case "transfer-token": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.to_address || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.to_address || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            to_address: formData.to_address,
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            decimals: parseInt(formData.decimals as string) || 9,
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/transfer/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`转账成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "转账失败");
          }
          break;
        }

        case "create-wsol-ata": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/wsol/create-ata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`创建成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "创建失败");
          }
          break;
        }

        case "wrap-sol": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            amount: parseFloat(formData.amount as string),
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/wsol/wrap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`封装成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "封装失败");
          }
          break;
        }

        case "unwrap-sol": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/wsol/unwrap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`解封成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "解封失败");
          }
          break;
        }

        case "create-nonce": {
          // Check if using keystore or private key
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/nonce/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`创建成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              nonceAccount: data.nonce_account,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "创建失败");
          }
          break;
        }

        case "setup-2fa": {
          if (!formData.hardware_fingerprint || !formData.master_password) {
            toast.error("请填写所有字段");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/2fa/setup`, {
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
            toast.success("2FA 设置成功！");
            setFormData((prev) => ({
              ...prev,
              totp_secret: data.totp_secret,
              qr_code_url: data.qr_code_url,
            }));
          } else {
            toast.error(data.error || "设置失败");
          }
          break;
        }

        case "create-tfa": {
          const usingKeystore = !!formData.keystoreJson;

          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.totp_secret || !formData.hardware_fingerprint ||
                !formData.master_password || formData.question_index === undefined || !formData.security_answer) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.totp_secret || !formData.hardware_fingerprint ||
                !formData.master_password || formData.question_index === undefined || !formData.security_answer) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            totp_secret: formData.totp_secret,
            hardware_fingerprint: formData.hardware_fingerprint,
            master_password: formData.master_password,
            question_index: formData.question_index,
            security_answer: formData.security_answer,
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/2fa/create-tfa`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("三重钱包创建成功！");
            setFormData((prev) => ({
              ...prev,
              encrypted_wallet: data.encrypted_wallet,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || "创建失败");
          }
          break;
        }

        case "unlock-tfa": {
          if (!formData.encrypted_wallet || !formData.hardware_fingerprint || !formData.master_password ||
              !formData.security_answer || !formData.totp_code) {
            toast.error("请填写所有字段");
            setLoading(false);
            return;
          }

          const response = await fetch(`${apiUrl}/2fa/unlock-tfa`, {
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
            toast.success("三重钱包解锁成功！");
            setFormData((prev) => ({
              ...prev,
              private_key: data.private_key,
              publicKey: data.public_key,
            }));
          } else {
            toast.error(data.error || "解锁失败");
          }
          break;
        }

        case "close-wsol-ata": {
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/wsol/close-ata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success(`WSOL ATA 关闭成功！签名: ${data.signature}`);
            setFormData((prev) => ({
              ...prev,
              signature: data.signature,
            }));
          } else {
            toast.error(data.error || "关闭失败");
          }
          break;
        }

        case "pumpfun-sell": {
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            slippage: formData.slippage ? Math.floor(parseFloat(formData.slippage as string) * 100) : 100,
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/pumpfun/sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("Pump.fun 卖出成功！");
            setFormData((prev) => ({
              ...prev,
              status: data.status,
            }));
          } else {
            toast.error(data.error || "卖出失败");
          }
          break;
        }

        case "pumpswap-sell": {
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key || !formData.mint || !formData.amount) {
              toast.error("请填写所有字段");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            mint: formData.mint,
            amount: parseFloat(formData.amount as string),
            slippage: formData.slippage ? Math.floor(parseFloat(formData.slippage as string) * 100) : 100,
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const response = await fetch(`${apiUrl}/pumpswap/sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            toast.success("PumpSwap 卖出成功！");
            setFormData((prev) => ({
              ...prev,
              status: data.status,
            }));
          } else {
            toast.error(data.error || "卖出失败");
          }
          break;
        }

        case "pumpfun-cashback":
        case "pumpswap-cashback": {
          const usingKeystore = !!formData.keystoreJson;
          if (usingKeystore) {
            if (!formData.keystoreJson || !formData.password) {
              toast.error("请上传 keystore 文件并输入密码");
              setLoading(false);
              return;
            }
          } else {
            if (!formData.private_key) {
              toast.error("请输入私钥");
              setLoading(false);
              return;
            }
          }

          const requestBody: ApiRequestBody = {
            network: formData.network || "mainnet",
          };

          if (usingKeystore) {
            requestBody.keystore_json = formData.keystoreJson;
            requestBody.password = formData.password;
          } else {
            requestBody.private_key = formData.private_key;
          }

          const apiUrlPath = formId === "pumpfun-cashback" ? "/pumpfun/cashback" : "/pumpswap/cashback";
          const response = await fetch(`${apiUrl}${apiUrlPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();

          if (response.ok) {
            if (data.status === "info") {
              toast.info(data.message);
            } else {
              toast.success("返现领取成功！");
            }
            setFormData((prev) => ({
              ...prev,
              message: data.message,
              status: data.status,
            }));
          } else {
            toast.error(data.error || "领取失败");
          }
          break;
        }

        default:
          toast.error("未知功能");
      }
    } catch {
      toast.error("请求失败，请检查后端是否运行");
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
              <label className="block text-sm font-medium mb-2">名称（可选）</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="default"
              />
            </div>
            <button
              onClick={() => handleSubmit("create-plain")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建明文私钥"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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
                  <label className="block text-sm font-medium mb-2">私钥（请妥善保管）</label>
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
              <label className="block text-sm font-medium mb-2">密码（10-20字符）</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="请输入密码"
              />
            </div>
            <button
              onClick={() => handleSubmit("create-encrypted")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建加密私钥"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
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
              <label className="block text-sm font-medium mb-2">密码（10-20字符）</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="请输入密码"
              />
            </div>
            <button
              onClick={() => handleSubmit("create-keystore")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建 Keystore 文件"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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
                  <label className="block text-sm font-medium mb-2">Keystore JSON</label>
                  <div className="flex gap-2">
                    <textarea
                      readOnly
                      className="flex-1 px-3 py-2 bg-black/30 rounded text-xs h-24 resize-none"
                      value={formData.keystoreJson}
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
                  下载 Keystore 文件
                </button>
              </div>
            )}
          </div>
        );

      case "import-keystore":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">选择 Keystore 文件</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
              />
            </div>
            <div className="text-center text-gray-400">或</div>
            <div>
              <label className="block text-sm font-medium mb-2">粘贴 Keystore JSON</label>
              <textarea
                value={formData.keystoreJson || ""}
                onChange={(e) => handleFormChange("keystoreJson", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                placeholder="粘贴 Keystore JSON 内容"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">密码</label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleFormChange("password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="请输入密码"
              />
            </div>
            <button
              onClick={() => handleSubmit("import-keystore")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "导入中..." : "导入 Keystore"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.publicKey}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">私钥</label>
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

      case "decrypt":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["decrypt"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["decrypt"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "decrypt": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["decrypt"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["decrypt"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["decrypt"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["decrypt"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 注意：私钥将以明文方式传输</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("decrypt")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "解密中..." : "解密私钥"}
            </button>
            {formData.secretKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">私钥</label>
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

      case "unlock":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["unlock"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["unlock"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "unlock": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["unlock"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["unlock"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["unlock"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["unlock"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 注意：私钥将以明文方式传输</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("unlock")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "解锁中..." : "解锁钱包"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.publicKey}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">私钥（已解锁）</label>
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

      case "check-balance":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">钱包地址</label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => handleFormChange("address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入钱包地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("check-balance")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "查询中..." : "查询余额"}
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

      case "get-pubkey":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.encryptedKey;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["get-pubkey"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "encrypted" });
                    const newFormData = { ...formData };
                    delete newFormData.secretKey;
                    delete newFormData.keystoreJson;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["get-pubkey"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, "get-pubkey": "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.encryptedKey;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    authMethod["get-pubkey"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["get-pubkey"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["get-pubkey"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encryptedKey || ""}
                    onChange={(e) => handleFormChange("encryptedKey", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[100px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["get-pubkey"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.secretKey || ""}
                  onChange={(e) => handleFormChange("secretKey", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 注意：私钥将以明文方式传输，建议使用加密方式</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit("get-pubkey")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "获取中..." : "获取公钥"}
            </button>
            {formData.publicKey && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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

      case "transfer-sol":
        return (
          <div className="space-y-4">
            {/* Authentication Method Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["transfer-sol"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["transfer-sol"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["transfer-sol"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {/* Keystore Input */}
            {authMethod["transfer-sol"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["transfer-sol"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["transfer-sol"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">发送方私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">接收方地址</label>
              <input
                type="text"
                value={formData.to_address || ""}
                onChange={(e) => handleFormChange("to_address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入接收方地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">金额 (SOL)</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入转账金额"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("transfer-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "发送中..." : "发送 SOL"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["transfer-token"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["transfer-token"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["transfer-token"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["transfer-token"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["transfer-token"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["transfer-token"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">发送方私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">接收方地址</label>
              <input
                type="text"
                value={formData.to_address || ""}
                onChange={(e) => handleFormChange("to_address", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入接收方地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Token Mint 地址</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入 Token Mint 地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">金额</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入转账金额"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">小数位数</label>
              <input
                type="number"
                value={formData.decimals || "9"}
                onChange={(e) => handleFormChange("decimals", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入小数位数（默认9）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("transfer-token")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "发送中..." : "发送 Token"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["create-wsol-ata"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["create-wsol-ata"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["create-wsol-ata"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["create-wsol-ata"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["create-wsol-ata"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["create-wsol-ata"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("create-wsol-ata")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建 WSOL ATA"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["wrap-sol"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["wrap-sol"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["wrap-sol"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["wrap-sol"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["wrap-sol"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["wrap-sol"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">封装金额 (SOL)</label>
              <input
                type="number"
                step="0.000000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入封装金额"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("wrap-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "封装中..." : "封装 SOL"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["unwrap-sol"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["unwrap-sol"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["unwrap-sol"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["unwrap-sol"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["unwrap-sol"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["unwrap-sol"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("unwrap-sol")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "解封中..." : "解封所有 WSOL"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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

      case "create-nonce":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["create-nonce"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["create-nonce"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["create-nonce"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["create-nonce"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["create-nonce"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["create-nonce"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("create-nonce")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建 Nonce 账户"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Nonce 账户地址</label>
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
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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

      case "setup-2fa":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">硬件指纹</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入唯一的硬件指纹字符串"
              />
              <p className="mt-1 text-xs text-gray-400">例如：机器UUID、MAC地址等唯一标识</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">主密码</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入主密码（10-20字符）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">账户名称（可选）</label>
              <input
                type="text"
                value={formData.account || ""}
                onChange={(e) => handleFormChange("account", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="例如：my-wallet@solana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">发行者（可选）</label>
              <input
                type="text"
                value={formData.issuer || ""}
                onChange={(e) => handleFormChange("issuer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="例如：Sol SafeKey"
              />
            </div>
            <button
              onClick={() => handleSubmit("setup-2fa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "生成中..." : "生成 2FA 密钥"}
            </button>
            {formData.totp_secret && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">TOTP 密钥</label>
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
                  <label className="block text-sm font-medium mb-2">二维码 URL</label>
                  <code className="block px-3 py-2 bg-black/30 rounded text-xs break-all">
                    {formData.qr_code_url}
                  </code>
                </div>
              </div>
            )}
          </div>
        );

      case "create-tfa":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || ""]: "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    setFormData(newFormData);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    authMethod[selectedForm || ""] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore 文件（推荐）
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || ""]: "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    authMethod[selectedForm || ""] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod[selectedForm || ""] === "keystore" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入要加密的私钥"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">TOTP 密钥</label>
              <input
                type="text"
                value={formData.totp_secret || ""}
                onChange={(e) => handleFormChange("totp_secret", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入从功能4生成的TOTP密钥"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">硬件指纹</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入硬件指纹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">主密码</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入主密码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">安全问题索引</label>
              <input
                type="number"
                value={formData.question_index || 0}
                onChange={(e) => handleFormChange("question_index", parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="0-9"
                min="0"
                max="9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">安全问题答案</label>
              <input
                type="text"
                value={formData.security_answer || ""}
                onChange={(e) => handleFormChange("security_answer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入安全问题答案"
              />
            </div>
            <button
              onClick={() => handleSubmit("create-tfa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建三重钱包"}
            </button>
            {formData.encrypted_wallet && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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
                  <label className="block text-sm font-medium mb-2">加密钱包数据</label>
                  <p className="text-xs text-gray-400">请妥善保存以下加密数据：</p>
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

      case "unlock-tfa":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">加密钱包数据</label>
              <textarea
                value={formData.encrypted_wallet || ""}
                onChange={(e) => handleFormChange("encrypted_wallet", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[100px]"
                placeholder="粘贴三重钱包的加密数据"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">硬件指纹</label>
              <input
                type="text"
                value={formData.hardware_fingerprint || ""}
                onChange={(e) => handleFormChange("hardware_fingerprint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入硬件指纹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">主密码</label>
              <input
                type="password"
                value={formData.master_password || ""}
                onChange={(e) => handleFormChange("master_password", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入主密码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">安全问题答案</label>
              <input
                type="text"
                value={formData.security_answer || ""}
                onChange={(e) => handleFormChange("security_answer", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入安全问题答案"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TOTP 验证码</label>
              <input
                type="text"
                value={formData.totp_code || ""}
                onChange={(e) => handleFormChange("totp_code", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入6位TOTP验证码"
                maxLength={6}
              />
            </div>
            <button
              onClick={() => handleSubmit("unlock-tfa")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "解锁中..." : "解锁三重钱包"}
            </button>
            {formData.private_key && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">公钥</label>
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
                  <label className="block text-sm font-medium mb-2">私钥</label>
                  <p className="text-xs text-red-400 mb-2">⚠️ 请妥善保管，不要分享给任何人！</p>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["close-wsol-ata"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["close-wsol-ata"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["close-wsol-ata"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["close-wsol-ata"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["close-wsol-ata"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["close-wsol-ata"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("close-wsol-ata")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "关闭中..." : "关闭 WSOL ATA"}
            </button>
            {formData.signature && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">交易签名</label>
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
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["pumpfun-sell"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["pumpfun-sell"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["pumpfun-sell"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["pumpfun-sell"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["pumpfun-sell"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["pumpfun-sell"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">代币 Mint 地址</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入代币的 mint 地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">卖出数量</label>
              <input
                type="number"
                step="0.000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入要卖出的代币数量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">滑点容忍度 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.slippage || 1}
                onChange={(e) => handleFormChange("slippage", parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="默认 1%"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("pumpfun-sell")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "卖出中..." : "卖出代币 (Pump.fun)"}
            </button>
            {formData.status === "success" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400">✅ 卖出成功！</p>
              </div>
            )}
          </div>
        );

      case "pumpswap-sell":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
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
                    authMethod["pumpswap-sell"] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore
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
                    authMethod["pumpswap-sell"] === "encrypted"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔒 加密私钥
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
                    authMethod["pumpswap-sell"] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod["pumpswap-sell"] === "keystore" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            )}

            {authMethod["pumpswap-sell"] === "encrypted" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">加密私钥</label>
                  <textarea
                    value={formData.encrypted_key || ""}
                    onChange={(e) => handleFormChange("encrypted_key", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white min-h-[120px]"
                    placeholder="输入加密的私钥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入解密密码"
                  />
                </div>
              </>
            )}

            {authMethod["pumpswap-sell"] === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
                <p className="mt-1 text-xs text-yellow-400">⚠️ 警告：私钥将以明文方式传输</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">代币 Mint 地址</label>
              <input
                type="text"
                value={formData.mint || ""}
                onChange={(e) => handleFormChange("mint", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入代币的 mint 地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">卖出数量</label>
              <input
                type="number"
                step="0.000001"
                value={formData.amount || ""}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="输入要卖出的代币数量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">滑点容忍度 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.slippage || 1}
                onChange={(e) => handleFormChange("slippage", parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                placeholder="默认 1%"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit("pumpswap-sell")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "卖出中..." : "卖出代币 (PumpSwap)"}
            </button>
            {formData.status === "success" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400">✅ 卖出成功！</p>
              </div>
            )}
          </div>
        );

      case "pumpfun-cashback":
      case "pumpswap-cashback":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">认证方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || ""]: "keystore" });
                    const newFormData = { ...formData };
                    delete newFormData.private_key;
                    setFormData(newFormData);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    authMethod[selectedForm || ""] === "keystore"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  📁 Keystore 文件（推荐）
                </button>
                <button
                  onClick={() => {
                    setAuthMethod({ ...authMethod, [selectedForm || ""]: "private" });
                    const newFormData = { ...formData };
                    delete newFormData.keystoreJson;
                    delete newFormData.password;
                    setFormData(newFormData);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    authMethod[selectedForm || ""] === "private"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  🔑 私钥
                </button>
              </div>
            </div>

            {authMethod[selectedForm || ""] === "keystore" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">上传 Keystore 文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                  {formData.keystoreJson && (
                    <p className="mt-2 text-xs text-green-400">✓ 文件已上传</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    placeholder="输入 keystore 密码"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">私钥</label>
                <input
                  type="password"
                  value={formData.private_key || ""}
                  onChange={(e) => handleFormChange("private_key", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                  placeholder="输入私钥的 Base58 编码"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">网络</label>
              <select
                value={formData.network || "mainnet"}
                onChange={(e) => handleFormChange("network", e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="mainnet">主网 (Mainnet)</option>
                <option value="devnet">测试网 (Devnet)</option>
              </select>
            </div>
            <button
              onClick={() => handleSubmit(selectedForm || "")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? "处理中..." : "领取返现"}
            </button>
            {formData.message && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">{formData.message}</p>
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-center text-gray-400">选择一个功能开始使用</div>;
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
