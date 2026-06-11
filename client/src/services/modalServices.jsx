// src/services/modalServices.jsx

import { Button } from "@/components/ui/button";
import useModalStore from "@/stores/useModalStore";

const { openModal, closeModal } = useModalStore.getState();

class ModalServices {
    
  //===========================================================================
  // очистить чат
  //===========================================================================
  handleClearChat(func = () => {}) {
    openModal({
      content: (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Очистить чат?</h2>
          <p className="text-slate-400">
            Это действие удалит все сообщения для всех участников. Отменить это
            будет невозможно.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => closeModal()}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                func(); // Вызываем переданную функцию
                closeModal(); // Закрываем модалку
              }}
            >
              Удалить всё
            </Button>
          </div>
        </div>
      ),
    });
  }

  //===========================================================================
  //  очистить загрузки
  //===========================================================================
  handleClearUploads(func = () => {}) {
    openModal({
      content: (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">
            Удалить все загрузки ?
          </h2>
          <p className="text-slate-400">
            Это действие удалит все загруженные файлы для всех участников.
            Отменить это будет невозможно.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => closeModal()}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                func(); // Вызываем переданную функцию
                closeModal(); // Закрываем модалку
              }}
            >
              Удалить всё
            </Button>
          </div>
        </div>
      ),
    });
  }

  //===========================================================================
  //   выйти из чата
  //===========================================================================
  handleLogout(func = () => {}) {
    openModal({
      content: (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Выйти из чата ?</h2>
          <p className="text-slate-400">
            Это действие выкинет вас из чата на страницу авторизации.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => closeModal()}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                func();
                closeModal(); // Закрываем модалку
              }}
            >
              Покинуть
            </Button>
          </div>
        </div>
      ),
    });
  }
}

export const modalServices = new ModalServices();
