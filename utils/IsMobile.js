const isMobileDevice = () => {
  return (
    (typeof window !== "undefined" && window?.orientation !== undefined) ||
    (typeof navigator !== "undefined" &&
      navigator?.userAgent?.indexOf("IEMobile") !== -1)
  );
};

export default isMobileDevice;