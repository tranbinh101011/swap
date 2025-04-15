import { Trans } from "@pancakeswap/localization";
import { Button, IMultiSelectChangeEvent, IMultiSelectProps, MultiSelect } from "@pancakeswap/uikit";
import { useCallback, useState } from "react";
import styled from "styled-components";

export interface INetworkProps {
  data: IMultiSelectProps<number>["options"];
  value: number[];
  onChange: (value: INetworkProps["value"], e: IMultiSelectChangeEvent<number>) => void;
}

const Container = styled.div<{ $isShow: boolean }>`
  flex: 1;

  .p-multiselect-panel {
    /* hack:
     * the primereact not support to custom the placement of panel
     * we need to place fixed to bottom
     * */
    top: 0 !important;
    left: 0 !important;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: -14px;
    padding: 8px 0;
  }
  ${({ $isShow, theme }) =>
    $isShow &&
    `
  && .select-input-container {
     border: 1px solid ${theme.colors.secondary};
     border-bottom: 1px solid ${theme.colors.inputSecondary};
     box-shadow: -2px -2px 2px 2px #7645D933, 2px -2px 2px 2px #7645D933;
     border-bottom-left-radius: 0;
     border-bottom-right-radius: 0;
  }
  && .p-multiselect-panel {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border: 1px solid ${theme.colors.secondary};
    box-shadow: 2px 2px 2px 2px #7645D933, -2px 2px 2px 2px #7645D933;
    border-top: none;
  }
 `}
`;

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const StyledButton = styled(Button)`
  position: absolute;
  right: 50px;

  height: 27px;
  background-color: ${({ theme }) => theme.colors.input};
  color: ${({ theme }) => theme.colors.text};
  opacity: 0;
  transition: opacity 0.3s ease-in;
`;

const StyledContainer = styled(Container)`
  .p-multiselect-item {
    padding: 8px 16px;
    transition: background-color 0.2s ease;
    cursor: pointer;
    position: relative;
    &:hover {
      background-color: ${({ theme }) =>
        theme.isDark ? "#4B3B5F" : "#E8E2EE"}; // secondary20 & wait for v4 to merge to use it
      ${StyledButton} {
        opacity: 1;
      }
    }
  }
`;

export const NetworkFilter: React.FC<INetworkProps> = ({ data, value, onChange }: INetworkProps) => {
  const [isShow, setIsShow] = useState(false);

  const handleSelectChange = useCallback(
    (e: IMultiSelectChangeEvent<number>) => {
      // keep the order with network list
      const sortedValue = data ? data.filter((opt) => e.value.includes(opt.value)).map((opt) => opt.value) : e.value;
      onChange(sortedValue, e);
    },
    [onChange, data]
  );

  const handleOnlyClick = useCallback(
    (networkValue: number, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([networkValue], {
        value: [networkValue],
        originalEvent: e,
        stopPropagation: e.stopPropagation,
        preventDefault: e.preventDefault,
      });
    },
    [onChange]
  );

  const customItemTemplate = useCallback(
    (option: { label: string; value: number; icon?: React.ReactNode | string }) => {
      return (
        <ItemContainer>
          <div style={{ display: "flex", alignItems: "center" }}>
            {option.icon && (
              <span style={{ marginRight: "8px" }}>
                {typeof option.icon === "string" ? (
                  <img src={option.icon} alt={option.label} width="24" />
                ) : (
                  option.icon
                )}
              </span>
            )}
            <span>{option.label}</span>
          </div>
          <StyledButton scale="xs" onClick={(e: React.MouseEvent) => handleOnlyClick(option.value, e)}>
            <Trans>Only</Trans>
          </StyledButton>
        </ItemContainer>
      );
    },
    [handleOnlyClick]
  );

  return (
    <StyledContainer $isShow={isShow}>
      <MultiSelect
        style={{
          backgroundColor: "var(--colors-input)",
        }}
        panelStyle={{
          backgroundColor: "var(--colors-input)",
        }}
        scrollHeight="322px"
        options={data}
        isShowSelectAll
        selectAllLabel="All networks"
        value={value}
        onShow={() => setIsShow(true)}
        onHide={() => setIsShow(false)}
        onChange={handleSelectChange}
        itemTemplate={customItemTemplate}
      />
    </StyledContainer>
  );
};
