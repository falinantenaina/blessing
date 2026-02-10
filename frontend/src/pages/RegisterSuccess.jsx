import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function RegisterSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue à bord !
        </h1>
        <p className="text-gray-600 mb-8">
          Félicitations ! Tu es désormais inscrit parmi nous. Ton compte a été
          créé avec succès.
        </p>
      </div>
    </div>
  );
}
