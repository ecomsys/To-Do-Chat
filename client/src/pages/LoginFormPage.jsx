import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import useChatStore from "../store/useChatStore"; // Подключаем стор

export default function LoginForm() { // УБРАЛИ ВСЕ ПРОПСЫ!
  // Забираем всё нужное напрямую из стора
  const role = useChatStore((state) => state.role);
  const setRole = useChatStore((state) => state.setRole);
  const name = useChatStore((state) => state.name);
  const setName = useChatStore((state) => state.setName);
  const password = useChatStore((state) => state.password);
  const setPassword = useChatStore((state) => state.setPassword);
  const passwordError = useChatStore((state) => state.passwordError);
  const loginError = useChatStore((state) => state.loginError);
  const setLoginError = useChatStore((state) => state.setLoginError);
  const setPasswordError = useChatStore((state) => state.setPasswordError);
  const handleLogin = useChatStore((state) => state.handleLogin);
  
  const availableRoles = useChatStore((state) => state.availableRoles);
  const fetchRoles = useChatStore((state) => state.fetchRoles);

  const [showPassword, setShowPassword] = useState(false);

  // При появлении формы - обновляем список ролей
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const clearErrors = () => {
    if (loginError) setLoginError("");
    if (passwordError) setPasswordError("");
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-slate-800/80 backdrop-blur-lg border border-slate-700 shadow-2xl rounded-xl">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-3xl font-bold text-white text-center tracking-tight">
            To‑Do Chat
          </CardTitle>
          <CardDescription className="text-slate-400 text-center pt-2 text-sm">
            Выберите роль и введите пароль для входа
          </CardDescription>
          
          {loginError && (
            <div className="mt-4 bg-red-900/40 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm text-center">
              {loginError}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Роль */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Роль</Label>
              <Select 
                onValueChange={(val) => { setRole(val); clearErrors(); }} 
                value={role}
              >
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white h-12 text-base focus:ring-blue-500">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 p-2 border border-slate-600">
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r} className="text-white focus:bg-blue-600 focus:text-white cursor-pointer">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Имя */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Имя <span className="text-slate-500 font-normal text-xs">(необязательно)</span>
              </Label>
              <Input
                type="text"
                placeholder="Как к вам обращаться?"
                value={name}
                onChange={(e) => { setName(e.target.value); clearErrors(); }}
                className="bg-slate-900/50 border-slate-600 text-white h-12 text-base focus:ring-blue-500"
              />
            </div>

            {/* Пароль */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Пароль</Label>
              <div className="relative">
                {showPassword ? (
                  <Input
                    key="input-text"
                    type="text"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                    className="bg-slate-900/50 border-slate-600 text-white h-12 text-base focus:ring-blue-500 pr-12"
                    autoComplete="off"
                    required
                  />
                ) : (
                  <Input
                    key="input-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                    className="bg-slate-900/50 border-slate-600 text-white h-12 text-base focus:ring-blue-500 pr-12"
                    autoComplete="off"
                    required
                  />
                )}

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none z-10 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold transition-all duration-200 mt-2">
              Войти в чат
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}