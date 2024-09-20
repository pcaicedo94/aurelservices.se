import ReactSelect from "react-select";

export default function Select(props) {
  const styles = {
    container: (baseStyles, state) => ({
      ...baseStyles,
      width: "50%",
    }),
    control: (provided, state) => ({
      ...provided,
      background: "#fff",
      borderColor: "gray",
      minHeight: "48px",
      height: "48px",
      boxShadow: state.isFocused ? null : null,
      "& .css-18w4uv4": {
        height: 48,
        padding: 0,
      },
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      height: "48px",
      padding: "0 8px",
    }),
    menu: (provided, state) => ({
      ...provided,
      zIndex: "100 !important",
    }),
    input: (provided, state) => ({
      ...provided,
      margin: "0px",
    }),
    indicatorSeparator: (state) => ({
      display: "none",
    }),

    indicatorsContainer: (provided, state) => ({
      ...provided,
      height: "48px",
    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      return {
        ...styles,
        ":active": {
          ...styles[":active"],
          backgroundColor: !isDisabled ? isFocused && "#34a783ba" : undefined,
        },
      };
    },
  };

  return (
    <ReactSelect
      styles={styles}
      theme={(theme) => ({
        ...theme,
        borderRadius: 5,
        height: "48px",
        colors: {
          ...theme.colors,
          primary25: "#34a7834f",
          primary: "#34a783",
        },
      })}
      {...props}
    />
  );
}
